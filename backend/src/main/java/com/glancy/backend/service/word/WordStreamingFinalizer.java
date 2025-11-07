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
