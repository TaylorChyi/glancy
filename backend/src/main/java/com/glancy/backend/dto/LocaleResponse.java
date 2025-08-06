package com.glancy.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

/**
 * Locale information returned for UI localization.
 */
@Data
@AllArgsConstructor
public class LocaleResponse {

    private String country;
    private String lang;
}
