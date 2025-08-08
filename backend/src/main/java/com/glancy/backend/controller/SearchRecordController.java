package com.glancy.backend.controller;

import com.glancy.backend.config.auth.AuthenticatedUser;
import com.glancy.backend.dto.SearchRecordRequest;
import com.glancy.backend.dto.SearchRecordResponse;
import com.glancy.backend.service.SearchRecordService;
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
    @PostMapping("/user/{userId}")
    public ResponseEntity<SearchRecordResponse> create(
        @AuthenticatedUser Long userId,
        @Valid @RequestBody SearchRecordRequest req
    ) {
        SearchRecordResponse resp = searchRecordService.saveRecord(userId, req);
        return new ResponseEntity<>(resp, HttpStatus.CREATED);
    }

    /**
     * Get a user's search history ordered by latest first.
     */
    @GetMapping("/user/{userId}")
    public ResponseEntity<List<SearchRecordResponse>> list(@AuthenticatedUser Long userId) {
        List<SearchRecordResponse> resp = searchRecordService.getRecords(userId);
        return ResponseEntity.ok(resp);
    }

    /**
     * Clear all search records for a user.
     */
    @DeleteMapping("/user/{userId}")
    public ResponseEntity<Void> clear(@AuthenticatedUser Long userId) {
        searchRecordService.clearRecords(userId);
        return ResponseEntity.noContent().build();
    }

    /**
     * Mark a search record as favorite for the user.
     */
    @PostMapping("/user/{userId}/{recordId}/favorite")
    public ResponseEntity<SearchRecordResponse> favorite(@AuthenticatedUser Long userId, @PathVariable Long recordId) {
        SearchRecordResponse resp = searchRecordService.favoriteRecord(userId, recordId);
        return ResponseEntity.ok(resp);
    }

    /**
     * Cancel favorite for a specific search record of the user.
     */
    @DeleteMapping("/user/{userId}/{recordId}/favorite")
    public ResponseEntity<Void> unfavorite(@AuthenticatedUser Long userId, @PathVariable Long recordId) {
        searchRecordService.unfavoriteRecord(userId, recordId);
        return ResponseEntity.noContent().build();
    }

    /**
     * Delete a specific search record of a user.
     */
    @DeleteMapping("/user/{userId}/{recordId}")
    public ResponseEntity<Void> delete(@AuthenticatedUser Long userId, @PathVariable Long recordId) {
        searchRecordService.deleteRecord(userId, recordId);
        return ResponseEntity.noContent().build();
    }
}
