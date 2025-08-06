package com.glancy.backend.controller;

import com.glancy.backend.dto.NotificationRequest;
import com.glancy.backend.dto.NotificationResponse;
import com.glancy.backend.service.NotificationService;
import jakarta.validation.Valid;
import java.util.List;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * Provides endpoints for managing notifications sent to users.
 * It covers both system wide announcements and personal messages.
 */
@RestController
@RequestMapping("/api/notifications")
@Slf4j
public class NotificationController {

    private final NotificationService notificationService;

    public NotificationController(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    /**
     * Publish a system level notification that is visible to all users.
     */
    @PostMapping("/system")
    public ResponseEntity<NotificationResponse> createSystem(@Valid @RequestBody NotificationRequest req) {
        log.info("Creating system notification with message '{}'", req.getMessage());
        NotificationResponse resp = notificationService.createSystemNotification(req);
        log.info("Created system notification {}", resp.getId());
        return new ResponseEntity<>(resp, HttpStatus.CREATED);
    }

    /**
     * Create a notification for a specific user. This serves the
     * requirement of user targeted messages.
     */
    @PostMapping("/user/{userId}")
    public ResponseEntity<NotificationResponse> createUser(
        @PathVariable Long userId,
        @Valid @RequestBody NotificationRequest req
    ) {
        log.info("Creating user notification for user {} with message '{}'", userId, req.getMessage());
        NotificationResponse resp = notificationService.createUserNotification(userId, req);
        log.info("Created user notification {} for user {}", resp.getId(), userId);
        return new ResponseEntity<>(resp, HttpStatus.CREATED);
    }

    /**
     * Retrieve all notifications available to a user including
     * system announcements.
     */
    @GetMapping("/user/{userId}")
    public ResponseEntity<List<NotificationResponse>> getForUser(@PathVariable Long userId) {
        log.info("Retrieving notifications for user {}", userId);
        List<NotificationResponse> resp = notificationService.getNotificationsForUser(userId);
        log.info("Returning {} notifications for user {}", resp.size(), userId);
        return ResponseEntity.ok(resp);
    }
}
