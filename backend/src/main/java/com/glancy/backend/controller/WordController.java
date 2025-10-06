package com.glancy.backend.controller;

import com.glancy.backend.config.auth.AuthenticatedUser;
import com.glancy.backend.dto.WordResponse;
import com.glancy.backend.entity.DictionaryFlavor;
import com.glancy.backend.entity.Language;
import com.glancy.backend.service.WordService;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.http.codec.ServerSentEvent;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Flux;

/**
 * Provides dictionary lookup functionality. Each request also
 * records the search for history tracking.
 */
@RestController
@RequestMapping("/api/words")
@Slf4j
public class WordController {

    private final WordService wordService;

    public WordController(WordService wordService) {
        this.wordService = wordService;
    }

    /**
     * Look up a word definition and save the search record.
     */
    @GetMapping
    public ResponseEntity<WordResponse> getWord(
        @AuthenticatedUser Long userId,
        @RequestParam String term,
        @RequestParam Language language,
        @RequestParam(required = false) String flavor,
        @RequestParam(required = false) String model,
        @RequestParam(defaultValue = "false") boolean forceNew,
        @RequestParam(defaultValue = "true") boolean captureHistory
    ) {
        DictionaryFlavor resolvedFlavor = DictionaryFlavor.fromNullable(flavor, DictionaryFlavor.BILINGUAL);
        WordResponse resp = wordService.findWordForUser(
            userId,
            term,
            language,
            resolvedFlavor,
            model,
            forceNew,
            captureHistory
        );
        return ResponseEntity.ok(resp);
    }

    /**
     * Stream word search results via SSE.
     */
    @GetMapping(value = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public Flux<ServerSentEvent<String>> streamWord(
        @AuthenticatedUser Long userId,
        @RequestParam String term,
        @RequestParam Language language,
        @RequestParam(required = false) String flavor,
        @RequestParam(required = false) String model,
        HttpServletResponse response,
        @RequestParam(defaultValue = "false") boolean forceNew,
        @RequestParam(defaultValue = "true") boolean captureHistory
    ) {
        response.setHeader(HttpHeaders.CACHE_CONTROL, CacheControl.noStore().getHeaderValue());
        response.setHeader("X-Accel-Buffering", "no");
        DictionaryFlavor resolvedFlavor = DictionaryFlavor.fromNullable(flavor, DictionaryFlavor.BILINGUAL);
        return wordService
            .streamWordForUser(userId, term, language, resolvedFlavor, model, forceNew, captureHistory)
            .doOnNext(payload ->
                log.info(
                    "Controller streaming chunk for user {} term '{}' event {}: {}",
                    userId,
                    term,
                    payload.event(),
                    payload.data()
                )
            )
            .doOnError(error -> log.error("Controller streaming error for user {} term '{}'", userId, term, error))
            .map(payload -> {
                ServerSentEvent.Builder<String> builder = ServerSentEvent.builder(payload.data());
                if (payload.event() != null) {
                    builder.event(payload.event());
                }
                return builder.build();
            })
            .doOnCancel(() -> log.info("Streaming canceled for user {} term '{}'", userId, term))
            .doFinally(sig -> log.info("Streaming finished with signal {} for user {} term '{}'", sig, userId, term));
    }
}
