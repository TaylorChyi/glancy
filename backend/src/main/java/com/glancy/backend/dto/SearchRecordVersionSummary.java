package com.glancy.backend.dto;

import java.time.LocalDateTime;

/**
 * Lightweight summary of a persisted search result version for a search term.
 */
public record SearchRecordVersionSummary(
    Long id,
    Integer versionNumber,
    LocalDateTime createdAt,
    String model,
    String preview
) {}
