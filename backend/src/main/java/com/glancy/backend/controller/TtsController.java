package com.glancy.backend.controller;

import com.glancy.backend.config.auth.AuthenticatedUser;
import com.glancy.backend.controller.request.TtsQueryRequest;
import com.glancy.backend.dto.TtsRequest;
import com.glancy.backend.dto.TtsResponse;
import com.glancy.backend.dto.VoiceResponse;
import com.glancy.backend.service.tts.TtsService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import java.util.Optional;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
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
    @PostMapping(value = "/word", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<TtsResponse> synthesizeWord(
        @AuthenticatedUser Long userId,
        HttpServletRequest httpRequest,
        @Valid @RequestBody TtsRequest request
    ) {
        String rid = String.valueOf(httpRequest.getAttribute("req.id"));
        String tokenStatus = String.valueOf(httpRequest.getAttribute("auth.token.status"));
        log.info("RID={}, entering {}, tokenStatus={}", rid, "synthesizeWord", tokenStatus);
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
        return buildResponse(userId, "Word synthesis", resp);
    }

    /**
     * Convenience GET endpoint allowing clients to fetch word pronunciations
     * without crafting a JSON payload. Returns encoded audio bytes and metadata
     * as JSON.
     */
    @GetMapping(value = "/word", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<TtsResponse> streamWord(
        @AuthenticatedUser Long userId,
        HttpServletRequest httpRequest,
        @ModelAttribute TtsQueryRequest query
    ) {
        TtsRequest req = query.toDto();
        String ip = httpRequest.getRemoteAddr();
        String rid = String.valueOf(httpRequest.getAttribute("req.id"));
        String tokenStatus = String.valueOf(httpRequest.getAttribute("auth.token.status"));
        log.info("RID={}, entering {}, tokenStatus={}", rid, "streamWord", tokenStatus);
        log.info(
            "Streaming word for user={}, ip={}, lang={}, voice={}, text={}",
            userId,
            ip,
            query.getLang(),
            query.getVoice(),
            query.getText()
        );
        Optional<TtsResponse> resp = ttsService.synthesizeWord(userId, ip, req);
        return buildResponse(userId, "Word stream", resp);
    }

    /**
     * Synthesize pronunciation for a sentence or example phrase.
     */
    @PostMapping(value = "/sentence", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<TtsResponse> synthesizeSentence(
        @AuthenticatedUser Long userId,
        HttpServletRequest httpRequest,
        @Valid @RequestBody TtsRequest request
    ) {
        String rid = String.valueOf(httpRequest.getAttribute("req.id"));
        String tokenStatus = String.valueOf(httpRequest.getAttribute("auth.token.status"));
        log.info("RID={}, entering {}, tokenStatus={}", rid, "synthesizeSentence", tokenStatus);
        String ip = httpRequest.getRemoteAddr();
        log.info(
            "Synthesizing sentence for user={}, ip={}, lang={}, voice={}",
            userId,
            ip,
            request.getLang(),
            request.getVoice()
        );
        Optional<TtsResponse> resp = ttsService.synthesizeSentence(userId, ip, request);
        return buildResponse(userId, "Sentence synthesis", resp);
    }

    /**
     * GET variant for sentence synthesis used when the client cannot easily
     * issue a POST request. Returns encoded audio bytes and metadata as JSON.
     */
    @GetMapping(value = "/sentence", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<TtsResponse> streamSentence(
        @AuthenticatedUser Long userId,
        HttpServletRequest httpRequest,
        @ModelAttribute TtsQueryRequest query
    ) {
        TtsRequest req = query.toDto();
        String ip = httpRequest.getRemoteAddr();
        String rid = String.valueOf(httpRequest.getAttribute("req.id"));
        String tokenStatus = String.valueOf(httpRequest.getAttribute("auth.token.status"));
        log.info("RID={}, entering {}, tokenStatus={}", rid, "streamSentence", tokenStatus);
        log.info(
            "Streaming sentence for user={}, ip={}, lang={}, voice={}, text={}",
            userId,
            ip,
            query.getLang(),
            query.getVoice(),
            query.getText()
        );
        Optional<TtsResponse> resp = ttsService.synthesizeSentence(userId, ip, req);
        return buildResponse(userId, "Sentence stream", resp);
    }

    private ResponseEntity<TtsResponse> buildResponse(Long userId, String action, Optional<TtsResponse> resp) {
        if (resp.isPresent()) {
            TtsResponse body = resp.get();
            log.info(
                "{} succeeded for user={}, durationMs={}, format={}, fromCache={}",
                action,
                userId,
                body.getDurationMs(),
                body.getFormat(),
                body.isFromCache()
            );
            return ResponseEntity.ok(body);
        }
        log.info("{} returned no content for user={}", action, userId);
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
