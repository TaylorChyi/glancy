package com.glancy.backend.controller;

import com.glancy.backend.config.auth.AuthenticatedUser;
import com.glancy.backend.controller.request.WordLookupRequest;
import com.glancy.backend.dto.WordResponse;
import com.glancy.backend.entity.DictionaryFlavor;
import com.glancy.backend.service.WordService;
import com.glancy.backend.service.word.WordSearchOptions;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Provides dictionary lookup functionality. Each request also records the search for history
 * tracking.
 */
@RestController
@RequestMapping("/api/words")
@Slf4j
public class WordController {

    private final WordService wordService;

    public WordController(WordService wordService) {
        this.wordService = wordService;
    }

    /** Look up a word definition and save the search record. */
    @GetMapping
    public ResponseEntity<WordResponse> getWord(
            @AuthenticatedUser Long userId, @ModelAttribute WordLookupRequest lookupRequest)
            throws MissingServletRequestParameterException {
        validateLookupRequest(lookupRequest);
        DictionaryFlavor resolvedFlavor = lookupRequest.resolvedFlavor();
        WordSearchOptions options = WordSearchOptions.of(
                lookupRequest.getTerm(),
                lookupRequest.getLanguage(),
                resolvedFlavor,
                lookupRequest.getModel(),
                lookupRequest.isForceNew(),
                lookupRequest.isCaptureHistory());
        WordResponse resp = wordService.findWordForUser(userId, options);
        return ResponseEntity.ok(resp);
    }

    private void validateLookupRequest(WordLookupRequest lookupRequest) throws MissingServletRequestParameterException {
        if (!StringUtils.hasText(lookupRequest.getTerm())) {
            throw new MissingServletRequestParameterException("term", "String");
        }
        if (lookupRequest.getLanguage() == null) {
            throw new MissingServletRequestParameterException("language", "Language");
        }
    }
}
