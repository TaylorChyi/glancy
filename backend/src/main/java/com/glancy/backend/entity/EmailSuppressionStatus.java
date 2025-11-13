package com.glancy.backend.entity;

/** Tracks why an email address is currently suppressed from receiving messages. */
public enum EmailSuppressionStatus {
    NONE,
    SOFT_BOUNCE,
    HARD_BOUNCE,
    COMPLAINT,
    MANUAL;

    public boolean isSuppressed() {
        return this != NONE;
    }
}
