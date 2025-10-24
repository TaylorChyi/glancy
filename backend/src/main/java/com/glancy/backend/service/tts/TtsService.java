package com.glancy.backend.service.tts;

import com.glancy.backend.dto.tts.TtsRequest;
import com.glancy.backend.dto.tts.TtsResponse;
import com.glancy.backend.dto.tts.VoiceResponse;
import java.util.Optional;

/**
 * Contracts for text to speech synthesis operations.
 */
public interface TtsService {
    /**
     * Synthesize audio for a single word.
     *
     * @param userId authenticated user performing the request
     * @param request synthesis parameters
     * @return optional response containing raw audio bytes and metadata; empty when cache miss and shortcut is true
     */
    Optional<TtsResponse> synthesizeWord(Long userId, String ip, TtsRequest request);

    /**
     * Synthesize audio for a sentence or arbitrary text.
     *
     * @param userId authenticated user performing the request
     * @param request synthesis parameters
     * @return optional response containing raw audio bytes and metadata; empty when cache miss and shortcut is true
     */
    Optional<TtsResponse> synthesizeSentence(Long userId, String ip, TtsRequest request);

    /**
     * Retrieve voice options available for the given language.
     *
     * @param userId authenticated user performing the request
     * @param lang language code
     * @return voice information
     */
    VoiceResponse listVoices(Long userId, String lang);
}
