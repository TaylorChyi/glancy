package com.glancy.backend.controller;

import com.glancy.backend.config.auth.AuthenticatedUser;
import com.glancy.backend.dto.AvatarRequest;
import com.glancy.backend.dto.AvatarResponse;
import com.glancy.backend.dto.LoginRequest;
import com.glancy.backend.dto.LoginResponse;
import com.glancy.backend.dto.ThirdPartyAccountRequest;
import com.glancy.backend.dto.ThirdPartyAccountResponse;
import com.glancy.backend.dto.UserRegistrationRequest;
import com.glancy.backend.dto.UserResponse;
import com.glancy.backend.dto.UsernameRequest;
import com.glancy.backend.dto.UsernameResponse;
import com.glancy.backend.entity.User;
import com.glancy.backend.service.UserService;
import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

/**
 * User management endpoints including registration, login and
 * third-party account binding.
 */
@RestController
@RequestMapping("/api/users")
@Slf4j
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    /**
     * Register a new user account.
     */
    @PostMapping("/register")
    public ResponseEntity<UserResponse> register(@Valid @RequestBody UserRegistrationRequest req) {
        log.info("Registering user with username '{}'", req.getUsername());
        UserResponse resp = userService.register(req);
        log.info("Registered user {}", resp.getId());
        return new ResponseEntity<>(resp, HttpStatus.CREATED);
    }

    /**
     * Delete (logically) an existing user account.
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        log.info("Deleting user {}", id);
        userService.deleteUser(id);
        return ResponseEntity.noContent().build();
    }

    /**
     * Fetch user information regardless of deletion status.
     */
    @GetMapping("/{id}")
    public ResponseEntity<User> getUser(@PathVariable Long id) {
        log.info("Fetching user {}", id);
        User user = userService.getUserRaw(id);
        return ResponseEntity.ok(user);
    }

    /**
     * Authenticate a user with username/email and password.
     */
    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@Valid @RequestBody LoginRequest req) {
        log.info("User login attempt with account '{}'", req.getAccount());
        LoginResponse resp = userService.login(req);
        log.info("User {} logged in", resp.getId());
        return new ResponseEntity<>(resp, HttpStatus.OK);
    }

    /**
     * Log out a user by clearing their login token.
     */
    @PostMapping("/{id}/logout")
    public ResponseEntity<Void> logout(@AuthenticatedUser User user) {
        log.info("User {} logging out", user.getId());
        userService.logout(user.getId(), user.getLoginToken());
        return ResponseEntity.noContent().build();
    }

    /**
     * Bind a third-party account to the specified user.
     */
    @PostMapping("/{id}/third-party-accounts")
    public ResponseEntity<ThirdPartyAccountResponse> bindThirdParty(
        @PathVariable Long id,
        @Valid @RequestBody ThirdPartyAccountRequest req
    ) {
        log.info("Binding third-party account '{}' for user {}", req.getProvider(), id);
        ThirdPartyAccountResponse resp = userService.bindThirdPartyAccount(id, req);
        log.info("Bound third-party account {} for user {}", resp.getId(), id);
        return new ResponseEntity<>(resp, HttpStatus.CREATED);
    }

    /**
     * Get the avatar URL for a specific user.
     */
    @GetMapping("/{id}/avatar")
    public ResponseEntity<AvatarResponse> getAvatar(@PathVariable Long id) {
        log.info("Fetching avatar for user {}", id);
        AvatarResponse resp = userService.getAvatar(id);
        return ResponseEntity.ok(resp);
    }

    /**
     * Update the avatar URL for a user.
     */
    @PutMapping("/{id}/avatar")
    public ResponseEntity<AvatarResponse> updateAvatar(@PathVariable Long id, @Valid @RequestBody AvatarRequest req) {
        log.info("Updating avatar for user {}", id);
        AvatarResponse resp = userService.updateAvatar(id, req.getAvatar());
        return ResponseEntity.ok(resp);
    }

    /**
     * Upload avatar file to OSS and update user record.
     */
    @PostMapping("/{id}/avatar-file")
    public ResponseEntity<AvatarResponse> uploadAvatar(
        @PathVariable Long id,
        @RequestParam("file") MultipartFile file
    ) {
        log.info("Uploading avatar file for user {}", id);
        AvatarResponse resp = userService.uploadAvatar(id, file);
        return ResponseEntity.ok(resp);
    }

    /**
     * Update the username for a user.
     */
    @PutMapping("/{id}/username")
    public ResponseEntity<UsernameResponse> updateUsername(
        @PathVariable Long id,
        @Valid @RequestBody UsernameRequest req
    ) {
        log.info("Updating username for user {}", id);
        UsernameResponse resp = userService.updateUsername(id, req.getUsername());
        return ResponseEntity.ok(resp);
    }

    /**
     * Get the total number of active users.
     */
    @GetMapping("/count")
    public ResponseEntity<Long> countUsers() {
        log.info("Counting active users");
        long count = userService.countActiveUsers();
        log.info("Active user count: {}", count);
        return ResponseEntity.ok(count);
    }
}
