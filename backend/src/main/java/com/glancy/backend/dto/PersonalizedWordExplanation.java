package com.glancy.backend.dto;

import java.util.List;

/**
 * Encapsulates a personalized narrative that helps a user connect a word
 * definition with their learning context.
 */
public record PersonalizedWordExplanation(
    String personaSummary,
    String keyTakeaway,
    String contextualExplanation,
    List<String> learningHooks,
    List<String> reflectionPrompts
) {}

