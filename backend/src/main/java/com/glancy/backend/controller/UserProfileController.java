package com.glancy.backend.controller;

import com.glancy.backend.dto.UserProfileRequest;
import com.glancy.backend.dto.UserProfileResponse;
import com.glancy.backend.service.UserProfileService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * Manage user personal profiles.
 */
@RestController
@RequestMapping("/api/profiles")
@Slf4j
public class UserProfileController {

    private final UserProfileService userProfileService;

    public UserProfileController(UserProfileService userProfileService) {
        this.userProfileService = userProfileService;
    }

    /**
     * Save profile for a user.
     */
    @PostMapping("/user/{userId}")
    public ResponseEntity<UserProfileResponse> saveProfile(
        @PathVariable Long userId,
        @RequestBody UserProfileRequest req
    ) {
        log.info("Saving profile for user {}", userId);
        UserProfileResponse resp = userProfileService.saveProfile(userId, req);
        log.info("Saved profile for user {}", userId);
        return new ResponseEntity<>(resp, HttpStatus.CREATED);
    }

    /**
     * Retrieve profile for a user.
     */
    @GetMapping("/user/{userId}")
    public ResponseEntity<UserProfileResponse> getProfile(@PathVariable Long userId) {
        log.info("Retrieving profile for user {}", userId);
        UserProfileResponse resp = userProfileService.getProfile(userId);
        return ResponseEntity.ok(resp);
    }
}
