package com.glancy.backend.controller;

import com.glancy.backend.config.auth.AuthenticatedUser;
import com.glancy.backend.dto.search.SearchRecordRequest;
import com.glancy.backend.dto.search.SearchRecordResponse;
import com.glancy.backend.service.SearchRecordService;
import com.glancy.backend.service.support.SearchRecordPageRequest;
import jakarta.validation.Valid;
import java.util.List;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * Endpoints for managing user search history. It allows recording
 * each search and provides retrieval and clearing operations.
 */
@RestController
@RequestMapping("/api/search-records")
@Slf4j
public class SearchRecordController {

    private final SearchRecordService searchRecordService;

    public SearchRecordController(SearchRecordService searchRecordService) {
        this.searchRecordService = searchRecordService;
    }

    /**
     * Record a search term for a user. Non-members are limited to
     * 10 searches per day as enforced in the service layer.
     */
    @PostMapping("/user")
    public ResponseEntity<SearchRecordResponse> create(
        @AuthenticatedUser Long userId,
        @Valid @RequestBody SearchRecordRequest req
    ) {
        SearchRecordResponse resp = searchRecordService.saveRecord(userId, req);
        log.info("Create search record response: {}", resp);
        return new ResponseEntity<>(resp, HttpStatus.CREATED);
    }

    /**
     * Get a user's search history ordered by latest first.
     */
    @GetMapping("/user")
    public ResponseEntity<List<SearchRecordResponse>> list(
        @AuthenticatedUser Long userId,
        @RequestParam(name = "page", required = false) Integer page,
        @RequestParam(name = "size", required = false) Integer size
    ) {
        SearchRecordPageRequest pageRequest = SearchRecordPageRequest.of(page, size);
        List<SearchRecordResponse> resp = searchRecordService.getRecords(userId, pageRequest);
        log.info("List search records response for user {}: {}", userId, resp);
        return ResponseEntity.ok(resp);
    }

    /**
     * Clear all search records for a user.
     */
    @DeleteMapping("/user")
    public ResponseEntity<Void> clear(@AuthenticatedUser Long userId) {
        searchRecordService.clearRecords(userId);
        log.info("Cleared search records for user {}", userId);
        return ResponseEntity.noContent().build();
    }

    /**
     * Mark a search record as favorite for the user.
     */
    @PostMapping("/user/{recordId}/favorite")
    public ResponseEntity<SearchRecordResponse> favorite(@AuthenticatedUser Long userId, @PathVariable Long recordId) {
        SearchRecordResponse resp = searchRecordService.favoriteRecord(userId, recordId);
        log.info("Favorite search record response: {}", resp);
        return ResponseEntity.ok(resp);
    }

    /**
     * Cancel favorite for a specific search record of the user.
     */
    @DeleteMapping("/user/{recordId}/favorite")
    public ResponseEntity<Void> unfavorite(@AuthenticatedUser Long userId, @PathVariable Long recordId) {
        searchRecordService.unfavoriteRecord(userId, recordId);
        log.info("Unfavorited record {} for user {}", recordId, userId);
        return ResponseEntity.noContent().build();
    }

    /**
     * Delete a specific search record of a user.
     */
    @DeleteMapping("/user/{recordId}")
    public ResponseEntity<Void> delete(@AuthenticatedUser Long userId, @PathVariable Long recordId) {
        searchRecordService.deleteRecord(userId, recordId);
        log.info("Deleted record {} for user {}", recordId, userId);
        return ResponseEntity.noContent().build();
    }
}
