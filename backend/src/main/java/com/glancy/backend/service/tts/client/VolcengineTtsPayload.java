package com.glancy.backend.service.tts.client;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotBlank;
import lombok.Builder;
import lombok.Value;

/**
 * Payload sent to Volcengine TTS API. The class captures all parameters
 * required by the upstream service and leverages bean validation to guard
 * against accidental omission of mandatory fields.
 */
@Value
@Builder
public class VolcengineTtsPayload {

    /** Application identifier issued by Volcengine. */
    @NotBlank
    @JsonProperty("appid")
    String appId;

    /** Access token for authentication. */
    @NotBlank
    @JsonProperty("access_token")
    String accessToken;

    /** Voice preset to synthesize. */
    @NotBlank
    @JsonProperty("voice_type")
    String voiceType;

    /** Text content to synthesize. */
    @NotBlank
    @JsonProperty("text")
    String text;

    /** Language code of the text. */
    @NotBlank
    @JsonProperty("lang")
    String lang;

    /** Desired audio format, e.g. mp3. */
    @JsonProperty("format")
    String format;

    /** Playback speed multiplier. */
    @JsonProperty("speed")
    Double speed;
}

