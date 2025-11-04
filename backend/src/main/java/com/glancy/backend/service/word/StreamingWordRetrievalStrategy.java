package com.glancy.backend.service.word;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.glancy.backend.dto.SearchRecordResponse;
import com.glancy.backend.dto.WordResponse;
import com.glancy.backend.entity.Word;
import com.glancy.backend.exception.BusinessException;
import com.glancy.backend.llm.service.WordSearcher;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

/**
 * 背景：
 *  - 流式查词流程在 WordService 内部实现，包含异常处理、日志及持久化收尾，导致文件过长。\
 * 目的：
 *  - 使用策略模式将流式查词逻辑抽离，使主服务只负责上下文构造。\
 * 关键决策与取舍：
 *  - 继续复用缓存命中流程，命中时直接返回序列化响应；\
 *  - 通过 {@link WordStreamingFinalizer} 统一处理收尾逻辑，保持与同步流程一致的持久化骨架。\
 * 影响范围：
 *  - WordService 的 `streamWordForUser` 方法改为简单委派。\
 * 演进与TODO：
 *  - 可在未来扩展断流重连或背压控制。
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class StreamingWordRetrievalStrategy implements WordRetrievalStrategy<Flux<WordStreamPayload>> {

    private final WordSearcher wordSearcher;
    private final WordCacheManager cacheManager;
    private final SearchRecordCoordinator searchRecordCoordinator;
    private final WordStreamingFinalizer streamingFinalizer;
    private final WordPersonalizationApplier personalizationApplier;

    @Override
    public Flux<WordStreamPayload> execute(WordQueryContext context) {
        return Flux.defer(() -> createStream(context));
    }

    private Flux<WordStreamPayload> createStream(WordQueryContext context) {
        SearchRecordResponse record;
        try {
            record = searchRecordCoordinator.createRecord(context);
        } catch (BusinessException e) {
            return Flux.error(e);
        } catch (Exception e) {
            log.error("Failed to save search record for user {}", context.userId(), e);
            return Flux.error(new IllegalStateException("Failed to save search record", e));
        }
        Optional<Flux<WordStreamPayload>> cached = tryServeFromCache(context, record);
        return cached.orElseGet(() -> streamFromModel(context, record));
    }

    private Optional<Flux<WordStreamPayload>> tryServeFromCache(WordQueryContext context, SearchRecordResponse record) {
        if (context.forceNew()) {
            return Optional.empty();
        }
        return cacheManager
            .findCachedWord(context.normalizedTerm(), context.language(), context.flavor())
            .map(word -> {
                log.info("Found cached word '{}' in language {}", word.getTerm(), context.language());
                searchRecordCoordinator.synchronizeRecordTermQuietly(context.userId(), idOf(record), word.getTerm());
                return serializeCachedWord(context, word);
            });
    }

    private Flux<WordStreamPayload> serializeCachedWord(WordQueryContext context, Word word) {
        try {
            WordResponse response = cacheManager.toResponse(word);
            response.setFlavor(context.flavor());
            WordResponse personalized = personalizationApplier.apply(
                context.userId(),
                response,
                context.personalizationContext()
            );
            String payload = cacheManager.serializeResponse(personalized);
            return Flux.just(WordStreamPayload.data(payload));
        } catch (JsonProcessingException e) {
            log.error("Failed to serialize cached word '{}'", context.rawTerm(), e);
            return Flux.error(new IllegalStateException("Failed to serialize cached word", e));
        }
    }

    private Flux<WordStreamPayload> streamFromModel(WordQueryContext context, SearchRecordResponse record) {
        WordStreamingSession session = new WordStreamingSession(
            context.userId(),
            idOf(record),
            context.rawTerm(),
            context.language(),
            context.flavor(),
            context.model(),
            context.personalizationContext(),
            context.captureHistory()
        );
        Flux<String> stream;
        try {
            stream = wordSearcher.streamSearch(
                context.rawTerm(),
                context.language(),
                context.flavor(),
                context.model(),
                context.personalizationContext()
            );
        } catch (BusinessException e) {
            return Flux.error(e);
        } catch (Exception e) {
            log.error("Error initiating streaming search for term '{}'", context.rawTerm(), e);
            return Flux.error(
                new IllegalStateException(String.format("Failed to initiate streaming search: %s", e.getMessage()), e)
            );
        }
        Flux<WordStreamPayload> main = stream
            .doOnNext(chunk -> {
                log.info("Streaming chunk for term '{}': {}", context.rawTerm(), chunk);
                session.append(chunk);
            })
            .doOnError(err ->
                log.error(
                    "Streaming error for user {} term '{}' in language {} using model {}: {}",
                    context.userId(),
                    context.rawTerm(),
                    context.language(),
                    context.model(),
                    err.getMessage(),
                    err
                )
            )
            .doOnError(session::markError)
            .map(WordStreamPayload::data);
        return main
            .concatWith(Mono.defer(() -> streamingFinalizer.finalizeSession(session)))
            .doFinally(session::logSummary);
    }

    private Long idOf(SearchRecordResponse record) {
        return record != null ? record.id() : null;
    }
}
