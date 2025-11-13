package com.glancy.backend.dto;

import java.util.List;

/**
 * Captures the learner persona signals that drive LLM prompt adaptation and downstream personalized
 * explanations.
 */
public record WordPersonalizationContext(
        String personaDescriptor,
        boolean personaDerivedFromProfile,
        String audienceDescriptor,
        String goal,
        String preferredTone,
        List<String> interests,
        List<String> recentTerms) {
    public WordPersonalizationContext {
        interests = interests == null ? List.of() : List.copyOf(interests);
        recentTerms = recentTerms == null ? List.of() : List.copyOf(recentTerms);
    }

    public boolean hasSignals() {
        return (personaDerivedFromProfile
                || (goal != null && !goal.isBlank())
                || (preferredTone != null && !preferredTone.isBlank())
                || !interests.isEmpty()
                || !recentTerms.isEmpty());
    }
}
