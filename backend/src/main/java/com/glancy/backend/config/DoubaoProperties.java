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
    private Integer maxCompletionTokens = 20480;

    /**
     * Whether to request streaming responses by default. 处于纯非流式消费场景时也必须显式
     * 传递 stream=false，以满足第三方接口对字段存在性的约束，规避回退分支被触发。
     */
    private Boolean defaultStream = Boolean.FALSE;

    /**
     * Default "thinking" mode requested from Doubao. Accepts values defined by
     * the upstream API such as "disabled" or "detailed".
     */
    private String defaultThinkingType = "disabled";
}
