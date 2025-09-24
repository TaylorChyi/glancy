package com.glancy.backend.gomemo.model;

/**
 * Enumerates practice modalities surfaced by Gomemo. The values double as
 * persistence tokens so order must remain stable.
 */
public enum GomemoStudyModeType {
    CARD,
    MULTIPLE_CHOICE,
    SPELLING,
    VISUAL_ASSOCIATION,
    LISTENING,
}
