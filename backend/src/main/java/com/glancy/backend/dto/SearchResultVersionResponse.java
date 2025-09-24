package com.glancy.backend.dto;

import com.glancy.backend.entity.Language;
import java.time.LocalDateTime;

/**
 * Detailed representation of a persisted search result version.
 */
public record SearchResultVersionResponse(
    Long id,
    Long recordId,
    Long wordId,
    Long userId,
    String term,
    Language language,
    Integer versionNumber,
    String model,
    String preview,
    String content,
    LocalDateTime createdAt
) {}
