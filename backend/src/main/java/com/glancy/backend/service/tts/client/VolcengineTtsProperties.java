package com.glancy.backend.service.tts.client;

import java.time.Duration;
import java.time.Instant;
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
    /** Access key used for request signing. */
    private String accessKeyId;

    /** Secret key paired with {@link #accessKeyId}. */
    private String secretKey;

    /**
     * Temporary session token issued alongside short lived credentials.
     * <p>
     * Only populated when integrating with STS based authentication. When
     * present the signer will include it as {@code X-Security-Token} header.
     */
    private String securityToken;

    /** Expiration timestamp for temporary credentials. */
    private Instant expiration;

    public static final String DEFAULT_REGION = "cn-north-1";
    public static final String DEFAULT_SERVICE = "speech_saas_prod";
    public static final String DEFAULT_API_URL = "https://openspeech.bytedance.com/api/v1/tts";

    /** Region targeted by the remote API. */
    private String region = DEFAULT_REGION;

    /** Service name required for signature scope. */
    private String service = DEFAULT_SERVICE;
    /** Default voice type used when request does not specify one. */
    private String voiceType;
    /** Token issued by Volcengine for authentication. */
    private String token;
    /** Cluster hint used by Volcengine routing. */
    private String cluster;
    /** Base URL of the TTS endpoint. */
    private String apiUrl = DEFAULT_API_URL;

    /** Interval between proactive health checks. */
    private Duration healthInterval = Duration.ofMinutes(10);
}
