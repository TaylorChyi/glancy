package com.glancy.backend.gomemo.model;

import java.util.List;

/**
 * Snapshot of a user's study persona used by Gomemo when deriving plans and
 * reviews. This object is intentionally immutable.
 */
public record GomemoPersona(
    Integer age,
    String descriptor,
    String audience,
    String tone,
    Integer dailyTarget,
    String goal,
    String futurePlan,
    List<String> interests
) {
    public boolean hasAge() {
        return age != null;
    }
}
