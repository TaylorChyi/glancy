package com.glancy.backend.controller;

import com.glancy.backend.config.auth.AuthenticatedUser;
import com.glancy.backend.dto.SearchRecordRequest;
import com.glancy.backend.dto.WordResponse;
import com.glancy.backend.entity.Language;
import com.glancy.backend.service.SearchRecordService;
import com.glancy.backend.service.WordService;
import lombok.extern.slf4j.Slf4j;
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
    private final SearchRecordService searchRecordService;

    public WordController(WordService wordService, SearchRecordService searchRecordService) {
        this.wordService = wordService;
        this.searchRecordService = searchRecordService;
    }

    /**
     * Look up a word definition and save the search record.
     */
    @GetMapping
    public ResponseEntity<WordResponse> getWord(
        @AuthenticatedUser Long userId,
        @RequestParam String term,
        @RequestParam Language language,
        @RequestParam(required = false) String model
    ) {
        SearchRecordRequest req = new SearchRecordRequest();
        req.setTerm(term);
        req.setLanguage(language);
        searchRecordService.saveRecord(userId, req);
        WordResponse resp = wordService.findWordForUser(userId, term, language, model);
        return ResponseEntity.ok(resp);
    }

    /**
     * Retrieve the pronunciation audio for a word.
     */
    @GetMapping(value = "/audio", produces = MediaType.APPLICATION_OCTET_STREAM_VALUE)
    public ResponseEntity<byte[]> getAudio(@RequestParam String term, @RequestParam Language language) {
        byte[] data = wordService.getAudio(term, language);
        return ResponseEntity.ok(data);
    }

    /**
     * Stream word search results via SSE.
     */
    @GetMapping(value = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public Flux<ServerSentEvent<String>> streamWord(
        @AuthenticatedUser Long userId,
        @RequestParam String term,
        @RequestParam Language language,
        @RequestParam(required = false) String model
    ) {
        return wordService
            .streamWordForUser(userId, term, language, model)
            .map(data -> ServerSentEvent.builder(data).build())
            .doOnCancel(() -> log.info("Streaming canceled for user {} term '{}'", userId, term))
            .onErrorResume(e -> {
                log.error("Streaming error for user {} term '{}'", userId, term, e);
                return Flux.just(ServerSentEvent.<String>builder(e.getMessage()).event("error").build());
            })
            .doFinally(sig -> log.info("Streaming finished with signal {} for user {} term '{}'", sig, userId, term));
    }
}
