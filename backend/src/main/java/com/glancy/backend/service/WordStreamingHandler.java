package com.glancy.backend.service;

import com.glancy.backend.llm.parser.ParsedWord;
import com.glancy.backend.llm.parser.WordResponseParser;
import com.glancy.backend.llm.service.WordSearcher;
import com.glancy.backend.llm.stream.CompletionSentinel;
import com.glancy.backend.llm.stream.CompletionSentinel.CompletionCheck;
import com.glancy.backend.util.SensitiveDataUtil;
import java.time.Duration;
import java.time.Instant;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.core.publisher.SignalType;

/**
 * Handles streaming word lookup sessions, including transcript aggregation and persistence orchestration.
 */
@Slf4j
@Component
public class WordStreamingHandler {

    private final WordSearcher wordSearcher;
    private final WordResponseParser parser;
    private final WordLookupCoordinator coordinator;

    public WordStreamingHandler(
        WordSearcher wordSearcher,
        WordResponseParser parser,
        WordLookupCoordinator coordinator
    ) {
        this.wordSearcher = wordSearcher;
        this.parser = parser;
        this.coordinator = coordinator;
    }

    public Flux<StreamPayload> stream(WordLookupCoordinator.WordLookupSession session) {
        StreamingAccumulator accumulator = new StreamingAccumulator(session);
        Flux<String> upstream;
        try {
            upstream = wordSearcher.streamSearch(
                session.request().term(),
                session.request().language(),
                session.request().flavor(),
                session.request().model(),
                session.personalizationContext()
            );
        } catch (Exception e) {
            log.error(
                "Error initiating streaming search for term '{}': {}",
                session.request().term(),
                e.getMessage(),
                e
            );
            String msg = "Failed to initiate streaming search: " + e.getMessage();
            return Flux.error(new IllegalStateException(msg, e));
        }

        Flux<StreamPayload> mainStream = upstream
            .doOnNext(chunk -> {
                log.info("Streaming chunk for term '{}': {}", session.request().term(), chunk);
                accumulator.append(chunk);
            })
            .doOnError(err ->
                log.error(
                    "Streaming error for user {} term '{}' in language {} using model {}: {}",
                    session.request().userId(),
                    session.request().term(),
                    session.request().language(),
                    session.request().model(),
                    err.getMessage(),
                    err
                )
            )
            .doOnError(accumulator::markError)
            .map(StreamPayload::data);

        return mainStream
            .concatWith(Mono.defer(() -> finalizeStreaming(accumulator)))
            .doFinally(accumulator::logSummary);
    }

    private Mono<StreamPayload> finalizeStreaming(StreamingAccumulator accumulator) {
        CompletionCheck completion = accumulator.summarize(SignalType.ON_COMPLETE);
        if (!completion.satisfied()) {
            log.warn(
                "Streaming session for term '{}' completed without sentinel '{}', skipping persistence",
                accumulator.session.request().term(),
                CompletionSentinel.MARKER
            );
            return Mono.empty();
        }
        try {
            ParsedWord parsed = parser.parse(
                completion.sanitizedContent(),
                accumulator.session.request().term(),
                accumulator.session.request().language()
            );
            return coordinator
                .persistStreamResult(accumulator.session, parsed)
                .map(versionId -> StreamPayload.version(String.valueOf(versionId)))
                .map(Mono::just)
                .orElseGet(Mono::empty);
        } catch (Exception e) {
            log.error("Failed to persist streamed word '{}'", accumulator.session.request().term(), e);
            return Mono.empty();
        }
    }

    private static final class StreamingAccumulator {

        private final WordLookupCoordinator.WordLookupSession session;
        private final Instant startedAt = Instant.now();
        private final StringBuilder transcript = new StringBuilder();
        private int chunkCount;
        private boolean error;
        private Throwable failure;
        private String snapshot;

        private StreamingAccumulator(WordLookupCoordinator.WordLookupSession session) {
            this.session = session;
        }

        private void append(String chunk) {
            chunkCount++;
            transcript.append(chunk);
        }

        private void markError(Throwable throwable) {
            error = true;
            failure = throwable;
        }

        private CompletionCheck summarize(SignalType signal) {
            long duration = Duration.between(startedAt, Instant.now()).toMillis();
            String aggregated = aggregatedContent();
            String errorSummary = "<none>";
            if (error) {
                String message = failure != null ? failure.getMessage() : "";
                errorSummary = SensitiveDataUtil.previewText(message);
            }
            CompletionCheck completion = CompletionSentinel.inspect(aggregated);
            log.info(
                "Streaming session summary [user={}, term='{}', language={}, model={}]: signal={}, " +
                "chunks={}, totalChars={}, durationMs={}, error={}, completionSentinelPresent={}, preview={}",
                session.request().userId(),
                session.request().term(),
                session.request().language(),
                session.request().model(),
                signal,
                chunkCount,
                aggregated.length(),
                duration,
                errorSummary,
                completion.satisfied(),
                SensitiveDataUtil.previewText(aggregated)
            );
            return completion;
        }

        private void logSummary(SignalType signal) {
            if (signal != SignalType.ON_COMPLETE) {
                summarize(signal);
            }
        }

        private String aggregatedContent() {
            if (snapshot == null) {
                snapshot = transcript.toString();
            }
            return snapshot;
        }
    }
}
