package com.glancy.backend.controller;

import com.glancy.backend.config.auth.AuthenticatedUser;
import com.glancy.backend.dto.TtsRequest;
import com.glancy.backend.dto.TtsResponse;
import com.glancy.backend.dto.VoiceResponse;
import com.glancy.backend.service.tts.TtsService;
import jakarta.validation.Valid;
import java.util.Optional;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * Endpoints for text to speech synthesis. The controller exposes
 * separate routes for word and sentence pronunciations and a query
 * interface for available voices.
 */
@RestController
@RequestMapping("/api/tts")
@Slf4j
public class TtsController {

    private final TtsService ttsService;

    public TtsController(TtsService ttsService) {
        this.ttsService = ttsService;
    }

    /**
     * Synthesize pronunciation for a word.
     */
    @PostMapping("/word")
    public ResponseEntity<TtsResponse> synthesizeWord(
        @AuthenticatedUser Long userId,
        @Valid @RequestBody TtsRequest request
    ) {
        Optional<TtsResponse> resp = ttsService.synthesizeWord(userId, request);
        return resp.map(ResponseEntity::ok).orElseGet(() -> ResponseEntity.noContent().build());
    }

    /**
     * Synthesize pronunciation for a sentence or example phrase.
     */
    @PostMapping("/sentence")
    public ResponseEntity<TtsResponse> synthesizeSentence(
        @AuthenticatedUser Long userId,
        @Valid @RequestBody TtsRequest request
    ) {
        Optional<TtsResponse> resp = ttsService.synthesizeSentence(userId, request);
        return resp.map(ResponseEntity::ok).orElseGet(() -> ResponseEntity.noContent().build());
    }

    /**
     * List voices available for the given language. The result may
     * vary depending on the user's subscription plan.
     */
    @GetMapping("/voices")
    public ResponseEntity<VoiceResponse> listVoices(@AuthenticatedUser Long userId, @RequestParam String lang) {
        VoiceResponse resp = ttsService.listVoices(userId, lang);
        return ResponseEntity.ok(resp);
    }
}
