package com.glancy.backend.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Configuration for Doubao API access.
 */
@Data
@ConfigurationProperties(prefix = "thirdparty.doubao")
public class DoubaoProperties {

    /** Base URL for Doubao API. */
    private String baseUrl = "https://ark.cn-beijing.volces.com";
    /** Endpoint path for chat completions. */
    private String chatPath = "/api/v3/chat/completions";
    /** API key for authentication. */
    private String apiKey;
    /** Doubao LLM model to use. */
    private String model = "doubao-seed-1-6-flash-250715";
    /**
     * Upper bound for completion tokens to avoid truncated responses while keeping
     * resource usage predictable.
     */
    private Integer maxCompletionTokens = 8192;
}
