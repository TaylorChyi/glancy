package com.glancy.backend.controller;

import com.glancy.backend.config.auth.AuthenticatedUser;
import com.glancy.backend.dto.TtsRequest;
import com.glancy.backend.dto.TtsResponse;
import com.glancy.backend.dto.VoiceResponse;
import com.glancy.backend.service.tts.TtsService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import java.net.URI;
import java.util.Optional;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
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
     * Build a {@link TtsRequest} from query parameters. GET requests cannot
     * submit JSON bodies so this helper translates the expected parameters
     * into the common request object used by the POST endpoints.
     */
    private TtsRequest buildRequest(String text, String lang, String voice, String format, double speed) {
        TtsRequest request = new TtsRequest();
        request.setText(text);
        request.setLang(lang);
        request.setVoice(voice);
        request.setFormat(format);
        request.setSpeed(speed);
        // shortcut disabled for GET so that the backend always returns audio
        request.setShortcut(false);
        return request;
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
     * Convenience GET endpoint allowing clients such as the native HTML audio
     * element to fetch word pronunciations without crafting a JSON payload. The
     * request is translated into a {@link TtsRequest} and on success a 302
     * redirect to the temporary audio URL is returned.
     */
    @GetMapping("/word")
    public ResponseEntity<Void> streamWord(
        @AuthenticatedUser Long userId,
        HttpServletRequest httpRequest,
        @RequestParam String text,
        @RequestParam String lang,
        @RequestParam(required = false) String voice,
        @RequestParam(defaultValue = "mp3") String format,
        @RequestParam(defaultValue = "1.0") double speed
    ) {
        TtsRequest req = buildRequest(text, lang, voice, format, speed);
        String ip = httpRequest.getRemoteAddr();
        log.info("Streaming word for user={}, ip={}, lang={}, voice={}, text={}", userId, ip, lang, voice, text);
        Optional<TtsResponse> resp = ttsService.synthesizeWord(userId, ip, req);
        if (resp.isPresent()) {
            TtsResponse body = resp.get();
            log.info(
                "Word stream succeeded for user={}, durationMs={}, format={}, fromCache={}",
                userId,
                body.getDurationMs(),
                body.getFormat(),
                body.isFromCache()
            );
            return ResponseEntity.status(HttpStatus.FOUND).location(URI.create(body.getUrl())).build();
        }
        log.info("Word stream returned no content for user={}", userId);
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
     * GET variant for sentence synthesis used when the client cannot easily
     * issue a POST request. Behaves similarly to {@link #streamWord}.
     */
    @GetMapping("/sentence")
    public ResponseEntity<Void> streamSentence(
        @AuthenticatedUser Long userId,
        HttpServletRequest httpRequest,
        @RequestParam String text,
        @RequestParam String lang,
        @RequestParam(required = false) String voice,
        @RequestParam(defaultValue = "mp3") String format,
        @RequestParam(defaultValue = "1.0") double speed
    ) {
        TtsRequest req = buildRequest(text, lang, voice, format, speed);
        String ip = httpRequest.getRemoteAddr();
        log.info("Streaming sentence for user={}, ip={}, lang={}, voice={}, text={}", userId, ip, lang, voice, text);
        Optional<TtsResponse> resp = ttsService.synthesizeSentence(userId, ip, req);
        if (resp.isPresent()) {
            TtsResponse body = resp.get();
            log.info(
                "Sentence stream succeeded for user={}, durationMs={}, format={}, fromCache={}",
                userId,
                body.getDurationMs(),
                body.getFormat(),
                body.isFromCache()
            );
            return ResponseEntity.status(HttpStatus.FOUND).location(URI.create(body.getUrl())).build();
        }
        log.info("Sentence stream returned no content for user={}", userId);
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
