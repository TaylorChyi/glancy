package com.glancy.backend.gomemo.model;

import com.glancy.backend.entity.Language;
import java.util.List;

/**
 * Immutable representation of a prioritized vocabulary entry.
 */
public record GomemoPlanWord(
    String term,
    Language language,
    int priorityScore,
    List<String> rationales,
    List<GomemoStudyModeType> recommendedModes
) {}
