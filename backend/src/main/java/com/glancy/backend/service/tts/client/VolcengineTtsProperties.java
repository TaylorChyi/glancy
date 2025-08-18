package com.glancy.backend.service.tts.client;

import java.time.Duration;
import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

/**
 * Configuration for Volcengine TTS API access.
 * <p>
 * Remote API parameters are case-sensitive; ensure values like action names
 * match the exact casing required by Volcengine.
 */
@Data
@Component
@ConfigurationProperties(prefix = "tts.volcengine")
public class VolcengineTtsProperties {

    public static final String DEFAULT_ACTION = "TextToSpeech";
    public static final String DEFAULT_VERSION = "2024-01-01";
    public static final String DEFAULT_API_URL = "https://open.volcengineapi.com";

    /** Application identifier issued by Volcengine. */
    private String appId;
    /** Default voice type used when request does not specify one. */
    private String voiceType;
    /** Operation name required by Volcengine API, e.g. {@code TextToSpeech}. */
    private String action = DEFAULT_ACTION;
    /**
     * Version of the Volcengine API to target.
     * <p>
     * The provider mandates an explicit version parameter for every request. This
     * default reflects the stable release as of 2024-01-01 and can be overridden via
     * configuration.
     */
    private String version = DEFAULT_VERSION;
    /** Base URL of the TTS endpoint. */
    private String apiUrl = DEFAULT_API_URL;

    /** Interval between proactive health checks. */
    private Duration healthInterval = Duration.ofMinutes(10);
}
