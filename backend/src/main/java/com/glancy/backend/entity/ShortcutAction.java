package com.glancy.backend.entity;

import java.util.Collections;
import java.util.List;

public enum ShortcutAction {
    FOCUS_SEARCH(List.of("MOD", "SHIFT", "F")),
    SWITCH_LANGUAGE(List.of("MOD", "SHIFT", "L")),
    TOGGLE_THEME(List.of("MOD", "SHIFT", "M")),
    TOGGLE_FAVORITE(List.of("MOD", "SHIFT", "B")),
    OPEN_SHORTCUTS(List.of("MOD", "SHIFT", "K"));

    private final List<String> defaultKeys;

    ShortcutAction(List<String> defaultKeys) {
        this.defaultKeys = List.copyOf(defaultKeys);
    }

    public List<String> getDefaultKeys() {
        return Collections.unmodifiableList(defaultKeys);
    }
}
