package com.glancy.backend.service.word;

import com.glancy.backend.dto.SearchRecordResponse;
import com.glancy.backend.dto.WordResponse;
import com.glancy.backend.llm.service.WordSearcher;
import com.glancy.backend.service.support.ResponseMarkdownOrSerializedWordStrategy;
import com.glancy.backend.service.support.WordPersistenceCoordinator;
import com.glancy.backend.service.support.WordPersistenceCoordinator.PersistenceOutcome;
import com.glancy.backend.service.support.WordVersionContentStrategy;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

/**
 * 背景：
 *  - WordService 的同步查词流程包含缓存命中、外部查询、持久化等步骤，逻辑冗长。\
 * 目的：
 *  - 以策略模式封装同步流程，复用缓存与持久化组件，保持职责清晰。\
 * 关键决策与取舍：
 *  - 选用默认 Markdown 策略 {@link ResponseMarkdownOrSerializedWordStrategy}，保持原行为；\
 *  - 当缓存命中时直接返回个性化响应，避免额外持久化。\
 * 影响范围：
 *  - WordService 调用该策略处理非流式请求。\
 * 演进与TODO：
 *  - 后续可注入指标或熔断逻辑。
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class SynchronousWordRetrievalStrategy implements WordRetrievalStrategy<WordResponse> {

    private final WordSearcher wordSearcher;
    private final WordCacheManager cacheManager;
    private final SearchRecordCoordinator searchRecordCoordinator;
    private final WordPersistenceContextFactory contextFactory;
    private final WordPersistenceCoordinator coordinator;
    private final WordPersonalizationApplier personalizationApplier;

    private final WordVersionContentStrategy defaultContentStrategy = new ResponseMarkdownOrSerializedWordStrategy();

    @Override
    public WordResponse execute(WordQueryContext context) {
        SearchRecordResponse record = searchRecordCoordinator.createRecord(context);
        Optional<WordResponse> cached = tryLoadFromCache(context, record);
        if (cached.isPresent()) {
            return cached.get();
        }
        return fetchAndPersist(context, record);
    }

    private Optional<WordResponse> tryLoadFromCache(WordQueryContext context, SearchRecordResponse record) {
        if (context.forceNew()) {
            return Optional.empty();
        }
        return cacheManager
            .findCachedWord(context.normalizedTerm(), context.language(), context.flavor())
            .map(word -> {
                log.info("Found word '{}' in local repository", word.getTerm());
                WordResponse response = cacheManager.toResponse(word);
                response.setFlavor(context.flavor());
                searchRecordCoordinator.synchronizeRecordTermQuietly(context.userId(), idOf(record), word.getTerm());
                return personalizationApplier.apply(context.userId(), response, context.personalizationContext());
            });
    }

    private WordResponse fetchAndPersist(WordQueryContext context, SearchRecordResponse record) {
        log.info(
            "Word '{}' (normalized '{}') not found locally or forceNew requested, searching via LLM model {}",
            context.rawTerm(),
            context.normalizedTerm(),
            context.model()
        );
        WordResponse response = wordSearcher.search(
            context.rawTerm(),
            context.language(),
            context.flavor(),
            context.model(),
            context.personalizationContext()
        );
        response.setFlavor(context.flavor());
        PersistenceOutcome outcome = contextFactory.persist(
            coordinator,
            new WordPersistenceContextFactory.WordPersistenceRequest(
                context.userId(),
                context.rawTerm(),
                context.language(),
                context.flavor(),
                context.model(),
                idOf(record),
                context.captureHistory(),
                response,
                context.personalizationContext(),
                null
            ),
            defaultContentStrategy
        );
        return outcome.response();
    }

    private Long idOf(SearchRecordResponse record) {
        return record != null ? record.id() : null;
    }
}
