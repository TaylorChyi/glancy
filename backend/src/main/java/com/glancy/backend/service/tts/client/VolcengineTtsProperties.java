package com.glancy.backend.service.tts.client;

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
    public static final String DEFAULT_ACTION = "TextToSpeech";
    public static final String DEFAULT_VERSION = "2020-06-09";
    public static final String DEFAULT_API_URL = "https://open.volcengineapi.com/v1/tts";

    /** Region targeted by the remote API. */
    private String region = DEFAULT_REGION;

    /** Service name required for signature scope. */
    private String service = DEFAULT_SERVICE;
    /** Default voice type used when request does not specify one. */
    private String voiceType;
    /** Operation name required by Volcengine API, e.g. {@code TextToSpeech}. */
    private String action = DEFAULT_ACTION;
    /**
     * Version of the Volcengine API to target.
     * <p>
     * The provider mandates an explicit version parameter for every request. This
     * default reflects the stable release as of 2020-06-09 and can be overridden via
     * configuration.
     */
    private String version = DEFAULT_VERSION;
    /** Base URL of the TTS endpoint. */
    private String apiUrl = DEFAULT_API_URL;
}
