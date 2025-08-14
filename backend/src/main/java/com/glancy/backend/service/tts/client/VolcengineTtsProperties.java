package com.glancy.backend.service.tts.client;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

/**
 * Configuration for Volcengine TTS API credentials.
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
    /**
     * Operation of Volcengine TTS service. Defaults to "text_to_speech" and
     * should match the action name expected by the remote API.
     */
    private String action = "text_to_speech";
    /** Base URL of the TTS endpoint. */
    private String apiUrl = "https://open.volcengineapi.com/v1/tts";
}
