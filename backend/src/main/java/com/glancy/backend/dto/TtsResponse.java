package com.glancy.backend.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/** Encapsulates synthesized audio bytes and related metadata. */
@Data
@AllArgsConstructor
@NoArgsConstructor
public class TtsResponse {

  /** Raw audio data. */
  @JsonProperty("data")
  private byte[] data;

  /** Audio duration in milliseconds. */
  @JsonProperty("duration_ms")
  private long durationMs;

  /** Audio format such as mp3. */
  private String format;

  /** Indicates whether the result was served from cache. */
  @JsonProperty("from_cache")
  private boolean fromCache;
}
