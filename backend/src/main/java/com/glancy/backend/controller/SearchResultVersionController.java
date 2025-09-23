package com.glancy.backend.controller;

import com.glancy.backend.config.auth.AuthenticatedUser;
import com.glancy.backend.dto.SearchResultVersionResponse;
import com.glancy.backend.dto.SearchResultVersionSummaryResponse;
import com.glancy.backend.service.SearchResultService;
import java.util.List;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * REST endpoints exposing version history for dictionary search results.
 */
@RestController
@RequestMapping("/api/search-records/{recordId}/versions")
@Slf4j
public class SearchResultVersionController {

    private final SearchResultService searchResultService;

    public SearchResultVersionController(SearchResultService searchResultService) {
        this.searchResultService = searchResultService;
    }

    @GetMapping
    public ResponseEntity<List<SearchResultVersionSummaryResponse>> list(
        @AuthenticatedUser Long userId,
        @PathVariable Long recordId
    ) {
        log.info("Listing versions for user {} record {}", userId, recordId);
        List<SearchResultVersionSummaryResponse> summaries = searchResultService.listSummaries(userId, recordId);
        return ResponseEntity.ok(summaries);
    }

    @GetMapping("/{versionId}")
    public ResponseEntity<SearchResultVersionResponse> get(
        @AuthenticatedUser Long userId,
        @PathVariable Long recordId,
        @PathVariable Long versionId
    ) {
        log.info("Fetching version {} for user {} record {}", versionId, userId, recordId);
        SearchResultVersionResponse response = searchResultService.getVersion(userId, recordId, versionId);
        return ResponseEntity.ok(response);
    }
}
