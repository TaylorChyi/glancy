package com.glancy.backend.service.tts;

import com.glancy.backend.dto.TtsRequest;
import com.glancy.backend.dto.TtsResponse;
import com.glancy.backend.dto.VoiceOption;
import com.glancy.backend.dto.VoiceResponse;
import com.glancy.backend.service.tts.client.VolcengineTtsClient;
import java.util.List;
import java.util.Optional;
import org.springframework.stereotype.Service;

/**
 * TTS service backed by Volcengine large model API.
 * The implementation keeps responsibilities focused: request
 * validation, rate limiting and caching are expected to be handled
 * by dedicated components. This class only orchestrates the remote
 * call and shapes the response for higher layers.
 */
@Service
public class VolcengineTtsService implements TtsService {

    private final VolcengineTtsClient client;

    public VolcengineTtsService(VolcengineTtsClient client) {
        this.client = client;
    }

    @Override
    public Optional<TtsResponse> synthesizeWord(Long userId, String ip, TtsRequest request) {
        return Optional.of(client.synthesize(request));
    }

    @Override
    public Optional<TtsResponse> synthesizeSentence(Long userId, String ip, TtsRequest request) {
        return Optional.of(client.synthesize(request));
    }

    @Override
    public VoiceResponse listVoices(Long userId, String lang) {
        String voice = client.getDefaultVoice();
        VoiceOption option = new VoiceOption(voice, voice, "all");
        return new VoiceResponse(voice, List.of(option));
    }
}
