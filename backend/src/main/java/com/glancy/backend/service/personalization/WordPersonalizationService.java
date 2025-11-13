package com.glancy.backend.service.personalization;

import com.glancy.backend.dto.PersonalizedWordExplanation;
import com.glancy.backend.dto.WordPersonalizationContext;
import com.glancy.backend.dto.WordResponse;

/**
 * Provides contextualized interpretations for dictionary entries based on a user's profile and
 * study traces.
 */
public interface WordPersonalizationService {
    WordPersonalizationContext resolveContext(Long userId);

    PersonalizedWordExplanation personalize(WordPersonalizationContext context, WordResponse response);

    default PersonalizedWordExplanation personalize(Long userId, WordResponse response) {
        return personalize(resolveContext(userId), response);
    }
}
