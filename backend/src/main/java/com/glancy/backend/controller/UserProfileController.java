package com.glancy.backend.controller;

import com.glancy.backend.config.auth.AuthenticatedUser;
import com.glancy.backend.dto.UserProfileRequest;
import com.glancy.backend.dto.UserProfileResponse;
import com.glancy.backend.service.UserProfileService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

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
    @PostMapping("/user")
    public ResponseEntity<UserProfileResponse> saveProfile(
        @AuthenticatedUser Long userId,
        @RequestBody UserProfileRequest req
    ) {
        UserProfileResponse resp = userProfileService.saveProfile(userId, req);
        return new ResponseEntity<>(resp, HttpStatus.CREATED);
    }

    /**
     * Retrieve profile for a user.
     */
    @GetMapping("/user")
    public ResponseEntity<UserProfileResponse> getProfile(@AuthenticatedUser Long userId) {
        UserProfileResponse resp = userProfileService.getProfile(userId);
        return ResponseEntity.ok(resp);
    }
}
