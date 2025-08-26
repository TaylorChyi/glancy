package com.glancy.backend.controller;

import com.glancy.backend.config.auth.AuthenticatedUser;
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
 * Provides endpoints for managing notifications sent to users. It covers both system wide
 * announcements and personal messages.
 */
@RestController
@RequestMapping("/api/notifications")
@Slf4j
public class NotificationController {

  private final NotificationService notificationService;

  public NotificationController(NotificationService notificationService) {
    this.notificationService = notificationService;
  }

  /** Publish a system level notification that is visible to all users. */
  @PostMapping("/system")
  public ResponseEntity<NotificationResponse> createSystem(
      @Valid @RequestBody NotificationRequest req) {
    NotificationResponse resp = notificationService.createSystemNotification(req);
    return new ResponseEntity<>(resp, HttpStatus.CREATED);
  }

  /**
   * Create a notification for a specific user. This serves the requirement of user targeted
   * messages.
   */
  @PostMapping("/user")
  public ResponseEntity<NotificationResponse> createUser(
      @AuthenticatedUser Long userId, @Valid @RequestBody NotificationRequest req) {
    NotificationResponse resp = notificationService.createUserNotification(userId, req);
    return new ResponseEntity<>(resp, HttpStatus.CREATED);
  }

  /** Retrieve all notifications available to a user including system announcements. */
  @GetMapping("/user")
  public ResponseEntity<List<NotificationResponse>> getForUser(@AuthenticatedUser Long userId) {
    List<NotificationResponse> resp = notificationService.getNotificationsForUser(userId);
    return ResponseEntity.ok(resp);
  }
}
