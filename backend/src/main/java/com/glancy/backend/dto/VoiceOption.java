package com.glancy.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Represents a single voice choice available under a language.
 */
@Data
@AllArgsConstructor
@NoArgsConstructor
public class VoiceOption {

    /** Unique voice identifier. */
    private String id;

    /** Human readable voice label. */
    private String label;

    /** Subscription plan that can access this voice. */
    private String plan;
}
