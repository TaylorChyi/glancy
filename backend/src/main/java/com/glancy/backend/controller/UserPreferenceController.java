package com.glancy.backend.controller;

import com.glancy.backend.config.auth.AuthenticatedUser;
import com.glancy.backend.dto.UserPreferenceRequest;
import com.glancy.backend.dto.UserPreferenceResponse;
import com.glancy.backend.service.UserPreferenceService;
import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * Manage user interface and language preferences.
 */
@RestController
@RequestMapping("/api/preferences")
@Slf4j
public class UserPreferenceController {

    private final UserPreferenceService userPreferenceService;

    public UserPreferenceController(UserPreferenceService userPreferenceService) {
        this.userPreferenceService = userPreferenceService;
    }

    /**
     * Persist UI and language preferences for a user.
     */
    @PostMapping("/user")
    public ResponseEntity<UserPreferenceResponse> savePreference(
        @AuthenticatedUser Long userId,
        @Valid @RequestBody UserPreferenceRequest req
    ) {
        UserPreferenceResponse resp = userPreferenceService.savePreference(userId, req);
        return new ResponseEntity<>(resp, HttpStatus.CREATED);
    }

    /**
     * Retrieve preferences previously saved for the user.
     */
    @GetMapping("/user")
    public ResponseEntity<UserPreferenceResponse> getPreference(@AuthenticatedUser Long userId) {
        UserPreferenceResponse resp = userPreferenceService.getPreference(userId);
        return ResponseEntity.ok(resp);
    }
}
