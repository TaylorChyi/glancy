package com.glancy.backend.controller;

import com.glancy.backend.config.auth.AuthenticatedUser;
import com.glancy.backend.dto.TtsRequest;
import com.glancy.backend.dto.TtsResponse;
import com.glancy.backend.dto.VoiceResponse;
import com.glancy.backend.service.tts.TtsService;
import jakarta.servlet.http.HttpServletRequest;
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
        HttpServletRequest httpRequest,
        @Valid @RequestBody TtsRequest request
    ) {
        String ip = httpRequest.getRemoteAddr();
        log.info(
            "Synthesizing word for user={}, ip={}, lang={}, voice={}, text={}",
            userId,
            ip,
            request.getLang(),
            request.getVoice(),
            request.getText()
        );
        Optional<TtsResponse> resp = ttsService.synthesizeWord(userId, ip, request);
        if (resp.isPresent()) {
            TtsResponse body = resp.get();
            log.info(
                "Word synthesis succeeded for user={}, durationMs={}, format={}, fromCache={}",
                userId,
                body.getDurationMs(),
                body.getFormat(),
                body.isFromCache()
            );
            return ResponseEntity.ok(body);
        }
        log.info("Word synthesis returned no content for user={}", userId);
        return ResponseEntity.noContent().build();
    }

    /**
     * Synthesize pronunciation for a sentence or example phrase.
     */
    @PostMapping("/sentence")
    public ResponseEntity<TtsResponse> synthesizeSentence(
        @AuthenticatedUser Long userId,
        HttpServletRequest httpRequest,
        @Valid @RequestBody TtsRequest request
    ) {
        String ip = httpRequest.getRemoteAddr();
        log.info(
            "Synthesizing sentence for user={}, ip={}, lang={}, voice={}",
            userId,
            ip,
            request.getLang(),
            request.getVoice()
        );
        Optional<TtsResponse> resp = ttsService.synthesizeSentence(userId, ip, request);
        if (resp.isPresent()) {
            TtsResponse body = resp.get();
            log.info(
                "Sentence synthesis succeeded for user={}, durationMs={}, format={}, fromCache={}",
                userId,
                body.getDurationMs(),
                body.getFormat(),
                body.isFromCache()
            );
            return ResponseEntity.ok(body);
        }
        log.info("Sentence synthesis returned no content for user={}", userId);
        return ResponseEntity.noContent().build();
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
