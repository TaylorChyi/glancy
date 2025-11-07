package com.glancy.backend.dto;

import java.util.List;

public record KeyboardShortcutView(String action, List<String> keys, List<String> defaultKeys) {}
