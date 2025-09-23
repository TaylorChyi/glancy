package com.glancy.backend.dto;

import com.glancy.backend.entity.Language;
import java.time.LocalDateTime;

/**
 * Response payload for search record queries enriched with the latest version summary.
 *
 * @param id unique identifier of the search record.
 * @param userId identifier of the owner user.
 * @param term searched keyword provided by the user.
 * @param language language context used during lookup.
 * @param createdAt timestamp when the search record was created.
 * @param favorite flag indicating whether the user marked this record as favorite.
 * @param latestVersion latest persisted version summary for this record, may be {@code null}.
 */
public record SearchRecordResponse(
    Long id,
    Long userId,
    String term,
    Language language,
    LocalDateTime createdAt,
    Boolean favorite,
    SearchResultVersionSummaryResponse latestVersion
) {}
