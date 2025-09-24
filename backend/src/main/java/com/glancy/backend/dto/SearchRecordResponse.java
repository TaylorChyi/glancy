package com.glancy.backend.dto;

import com.glancy.backend.entity.Language;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Represents a saved search history item returned to the client.
 */
public record SearchRecordResponse(
    Long id,
    Long userId,
    String term,
    Language language,
    LocalDateTime createdAt,
    Boolean favorite,
    SearchRecordVersionSummary latestVersion,
    List<SearchRecordVersionSummary> versions
) {
    public SearchRecordResponse {
        versions = versions == null ? List.of() : List.copyOf(versions);
    }

    public SearchRecordResponse withVersionDetails(
        SearchRecordVersionSummary latest,
        List<SearchRecordVersionSummary> versionSummaries
    ) {
        return new SearchRecordResponse(
            id,
            userId,
            term,
            language,
            createdAt,
            favorite,
            latest,
            versionSummaries == null ? List.of() : List.copyOf(versionSummaries)
        );
    }
}
