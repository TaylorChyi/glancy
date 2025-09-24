package com.glancy.backend.service.personalization;

import com.glancy.backend.dto.PersonalizedWordExplanation;
import com.glancy.backend.dto.WordResponse;

/**
 * Provides contextualized interpretations for dictionary entries based on a
 * user's profile and study traces.
 */
public interface WordPersonalizationService {
    PersonalizedWordExplanation personalize(Long userId, WordResponse response);
}
