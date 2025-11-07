package com.glancy.backend.controller;

import com.glancy.backend.config.auth.AuthenticatedUser;
import com.glancy.backend.dto.WordResponse;
import com.glancy.backend.entity.DictionaryFlavor;
import com.glancy.backend.entity.Language;
import com.glancy.backend.service.WordService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

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
}
