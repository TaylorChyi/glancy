package com.glancy.backend.controller;

import com.glancy.backend.config.auth.AuthenticatedUser;
import com.glancy.backend.dto.SearchRecordVersionSummary;
import com.glancy.backend.dto.SearchResultVersionResponse;
import com.glancy.backend.entity.SearchResultVersion;
import com.glancy.backend.service.SearchResultService;
import java.util.List;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** Exposes read-only access to search result versions for dictionary lookups. */
@RestController
@RequestMapping("/api/words/{recordId}/versions")
@Slf4j
public class SearchResultVersionController {

    private final SearchResultService searchResultService;

    public SearchResultVersionController(SearchResultService searchResultService) {
        this.searchResultService = searchResultService;
    }

    @GetMapping
    public ResponseEntity<List<SearchRecordVersionSummary>> listVersions(
            @AuthenticatedUser Long userId, @PathVariable Long recordId) {
        log.info("Listing versions for user {} record {}", userId, recordId);
        List<SearchRecordVersionSummary> summaries = searchResultService.listVersionSummaries(userId, recordId);
        log.info("Found {} versions for user {} record {}", summaries.size(), userId, recordId);
        return ResponseEntity.ok(summaries);
    }

    @GetMapping("/{versionId}")
    public ResponseEntity<SearchResultVersionResponse> getVersion(
            @AuthenticatedUser Long userId, @PathVariable Long recordId, @PathVariable Long versionId) {
        log.info("Fetching version {} for user {} record {}", versionId, userId, recordId);
        SearchResultVersion version = searchResultService.getVersionDetail(userId, recordId, versionId);
        SearchResultVersionResponse response = new SearchResultVersionResponse(
                version.getId(),
                version.getSearchRecord().getId(),
                version.getWord() != null ? version.getWord().getId() : null,
                version.getUser() != null ? version.getUser().getId() : null,
                version.getTerm(),
                version.getLanguage(),
                version.getVersionNumber(),
                version.getModel(),
                version.getPreview(),
                version.getContent(),
                version.getCreatedAt());
        log.info(
                "Returning version {} for record {} user {} with model {}",
                response.id(),
                response.recordId(),
                response.userId(),
                response.model());
        return ResponseEntity.ok(response);
    }
}
