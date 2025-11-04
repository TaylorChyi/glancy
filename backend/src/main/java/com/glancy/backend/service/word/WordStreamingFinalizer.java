package com.glancy.backend.service.word;

import com.glancy.backend.llm.parser.ParsedWord;
import com.glancy.backend.llm.parser.WordResponseParser;
import com.glancy.backend.service.support.WordPersistenceCoordinator;
import com.glancy.backend.service.support.WordPersistenceCoordinator.PersistenceOutcome;
import com.glancy.backend.service.support.WordVersionContentStrategy;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;
import reactor.core.publisher.SignalType;

/**
 * 背景：
 *  - 流式查词结束后的解析与持久化逻辑原先直接写在 WordService 中，异常处理复杂且难以复用。\
 * 目的：
 *  - 封装流式会话完成时的统一流程：校验结束标记、解析响应、回写存储。\
 * 关键决策与取舍：
 *  - 将版本内容策略以构造参数注入，便于测试时替换；\
 *  - 遇到解析或持久化失败时以空流返回，保持流式体验稳定。\
 * 影响范围：
 *  - 流式策略在终止时调用该组件完成落库。\
 * 演进与TODO：
 *  - 可根据需要扩展指标或重试策略。
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class WordStreamingFinalizer {

    private final WordResponseParser parser;
    private final WordPersistenceCoordinator coordinator;
    private final WordPersistenceContextFactory contextFactory;
    private final WordVersionContentStrategy streamingVersionContentStrategy;

    public Mono<WordStreamPayload> finalizeSession(WordStreamingSession session) {
        return Mono.fromCallable(() -> session.summarize(SignalType.ON_COMPLETE))
            .filter(completionCheck -> completionCheck.satisfied())
            .flatMap(check -> persistSession(session, check.sanitizedContent()))
            .switchIfEmpty(
                Mono.defer(() -> {
                    log.warn(
                        "Streaming session for term '{}' completed without sentinel '{}', skipping persistence",
                        session.getTerm(),
                        com.glancy.backend.llm.stream.CompletionSentinel.MARKER
                    );
                    return Mono.empty();
                })
            );
    }

    private Mono<WordStreamPayload> persistSession(WordStreamingSession session, String sanitizedContent) {
        try {
            ParsedWord parsed = parser.parse(sanitizedContent, session.getTerm(), session.getLanguage());
            parsed.parsed().setFlavor(session.getFlavor());
            PersistenceOutcome outcome = contextFactory.persist(
                coordinator,
                new WordPersistenceContextFactory.WordPersistenceRequest(
                    session.getUserId(),
                    session.getTerm(),
                    session.getLanguage(),
                    session.getFlavor(),
                    session.getModel(),
                    session.getRecordId(),
                    session.isCaptureHistory(),
                    parsed.parsed(),
                    session.getPersonalizationContext(),
                    parsed.markdown()
                ),
                streamingVersionContentStrategy
            );
            if (outcome.version() == null || outcome.version().getId() == null) {
                return Mono.empty();
            }
            return Mono.just(WordStreamPayload.version(String.valueOf(outcome.version().getId())));
        } catch (Exception e) {
            log.error("Failed to persist streamed word '{}'", session.getTerm(), e);
            return Mono.empty();
        }
    }
}
