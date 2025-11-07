package com.glancy.backend.service.word;

import com.glancy.backend.dto.WordPersonalizationContext;
import com.glancy.backend.entity.DictionaryFlavor;
import com.glancy.backend.entity.Language;
import com.glancy.backend.llm.stream.CompletionSentinel;
import com.glancy.backend.llm.stream.CompletionSentinel.CompletionCheck;
import com.glancy.backend.util.SensitiveDataUtil;
import java.time.Duration;
import java.time.Instant;
import lombok.Getter;
import lombok.extern.slf4j.Slf4j;
import reactor.core.publisher.SignalType;


@Slf4j
@Getter
public class WordStreamingSession {

    private final Long userId;
    private final Long recordId;
    private final String term;
    private final Language language;
    private final DictionaryFlavor flavor;
    private final String model;
    private final WordPersonalizationContext personalizationContext;
    private final boolean captureHistory;
    private final Instant startedAt = Instant.now();
    private final StringBuilder transcript = new StringBuilder();

    private int chunkCount;
    private boolean error;
    private Throwable failure;
    private String snapshot;

    public WordStreamingSession(
        Long userId,
        Long recordId,
        String term,
        Language language,
        DictionaryFlavor flavor,
        String model,
        WordPersonalizationContext personalizationContext,
        boolean captureHistory
    ) {
        this.userId = userId;
        this.recordId = recordId;
        this.term = term;
        this.language = language;
        this.flavor = flavor;
        this.model = model;
        this.personalizationContext = personalizationContext;
        this.captureHistory = captureHistory;
    }

    public void append(String chunk) {
        chunkCount++;
        transcript.append(chunk);
    }

    public void markError(Throwable throwable) {
        error = true;
        failure = throwable;
    }

    public CompletionCheck summarize(SignalType signal) {
        long duration = Duration.between(startedAt, Instant.now()).toMillis();
        String aggregated = aggregatedContent();
        String errorSummary = "<none>";
        if (error) {
            String message = failure != null ? failure.getMessage() : "";
            errorSummary = SensitiveDataUtil.previewText(message);
        }
        CompletionCheck completion = CompletionSentinel.inspect(aggregated);
        log.info(
            "Streaming session summary [user={}, term='{}', language={}, model={}]: signal={}, chunks={}, " +
            "totalChars={}, durationMs={}, error={}, completionSentinelPresent={}, preview={}",
            userId,
            term,
            language,
            model,
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

    public void logSummary(SignalType signal) {
        if (signal != SignalType.ON_COMPLETE) {
            summarize(signal);
        }
    }

    public String aggregatedContent() {
        if (snapshot == null) {
            snapshot = transcript.toString();
        }
        return snapshot;
    }
}
