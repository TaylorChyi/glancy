package com.glancy.backend.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/** Response payload describing available voices for a language. */
@Data
@AllArgsConstructor
@NoArgsConstructor
public class VoiceResponse {

    /** Default voice identifier for the language. */
    @JsonProperty("default")
    private String defaultVoice;

    /** All voice options available. */
    private List<VoiceOption> options;
}
