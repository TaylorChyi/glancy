package com.glancy.backend.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Data;
import org.springframework.lang.Nullable;

/** Request body used when partially updating stored user preferences. */
@Data
@JsonInclude(JsonInclude.Include.NON_NULL)
public class UserPreferenceUpdateRequest {

    @Nullable
    private String theme;

    @Nullable
    private String systemLanguage;

    @Nullable
    private String searchLanguage;
}
