package com.glancy.backend.dto;

import com.glancy.backend.entity.DictionaryModel;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

/** Request body used when saving user preferences. */
@Data
public class UserPreferenceRequest {

  @NotBlank(message = "{validation.userPreference.theme.notblank}")
  private String theme;

  @NotBlank(message = "{validation.userPreference.systemLanguage.notblank}")
  private String systemLanguage;

  @NotBlank(message = "{validation.userPreference.searchLanguage.notblank}")
  private String searchLanguage;

  @NotNull(message = "{validation.userPreference.dictionaryModel.notnull}")
  private DictionaryModel dictionaryModel;
}
