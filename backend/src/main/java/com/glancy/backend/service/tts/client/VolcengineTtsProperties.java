package com.glancy.backend.service.tts.client;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

/**
 * Configuration for Volcengine TTS API credentials.
 * <p>
 * Remote API parameters are case-sensitive; ensure values like action names
 * match the exact casing required by Volcengine.
 */
@Data
@Component
@ConfigurationProperties(prefix = "tts.volcengine")
public class VolcengineTtsProperties {

    /** Application identifier issued by Volcengine. */
    private String appId;
    /** Access token for authenticating requests. */
    private String accessToken;
    /** Default voice type used when request does not specify one. */
    private String voiceType;
    /** Operation name required by Volcengine API, e.g. {@code TextToSpeech}. */
    private String action = "TextToSpeech";
    /** Base URL of the TTS endpoint. */
    private String apiUrl = "https://open.volcengineapi.com/v1/tts";
}
