package com.glancy.backend.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Response payload containing synthesized audio metadata.
 */
@Data
@AllArgsConstructor
@NoArgsConstructor
public class TtsResponse {

    /** Temporary URL for the audio file. */
    private String url;

    /** Audio duration in milliseconds. */
    @JsonProperty("duration_ms")
    private long durationMs;

    /** Audio format such as mp3. */
    private String format;

    /** Indicates whether the result was served from cache. */
    @JsonProperty("from_cache")
    private boolean fromCache;

    /** Object storage key for the audio file. */
    @JsonProperty("object_key")
    private String objectKey;
}
