package com.glancy.backend.dto;

import java.time.LocalDateTime;

/**
 * Lightweight summary of an individual history version for a search term.
 */
public record SearchRecordVersionSummary(Long id, LocalDateTime createdAt, Boolean favorite) {}
