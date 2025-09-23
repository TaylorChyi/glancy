package com.glancy.backend.dto;

import java.time.LocalDateTime;

/**
 * Summary of a persisted search result version for list rendering.
 *
 * @param id unique identifier of the version entity.
 * @param searchRecordId identifier of the owning search record.
 * @param versionNumber sequential number within the record history.
 * @param model language model used to generate the version.
 * @param preview truncated preview text for quick scanning.
 * @param createdAt timestamp indicating when this version was captured.
 */
public record SearchResultVersionSummaryResponse(
    Long id,
    Long searchRecordId,
    Long versionNumber,
    String model,
    String preview,
    LocalDateTime createdAt
) {}
