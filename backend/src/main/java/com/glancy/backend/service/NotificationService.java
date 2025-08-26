package com.glancy.backend.service;

import com.glancy.backend.dto.NotificationRequest;
import com.glancy.backend.dto.NotificationResponse;
import com.glancy.backend.entity.Notification;
import com.glancy.backend.entity.User;
import com.glancy.backend.exception.ResourceNotFoundException;
import com.glancy.backend.repository.NotificationRepository;
import com.glancy.backend.repository.UserRepository;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Business logic around creating and listing notifications that may either be global announcements
 * or user specific.
 */
@Slf4j
@Service
public class NotificationService {

  private final NotificationRepository notificationRepository;
  private final UserRepository userRepository;

  public NotificationService(
      NotificationRepository notificationRepository, UserRepository userRepository) {
    this.notificationRepository = notificationRepository;
    this.userRepository = userRepository;
  }

  /** Create a system level notification for all users. */
  @Transactional
  public NotificationResponse createSystemNotification(NotificationRequest request) {
    log.info("Creating system notification: {}", request.getMessage());
    Notification notification = new Notification();
    notification.setMessage(request.getMessage());
    notification.setSystemLevel(true);
    Notification saved = notificationRepository.save(notification);
    return toResponse(saved);
  }

  /** Create a notification for a single user. */
  @Transactional
  public NotificationResponse createUserNotification(Long userId, NotificationRequest request) {
    log.info("Creating notification for user {}: {}", userId, request.getMessage());
    User user =
        userRepository.findById(userId).orElseThrow(() -> new ResourceNotFoundException("用户不存在"));
    Notification notification = new Notification();
    notification.setMessage(request.getMessage());
    notification.setSystemLevel(false);
    notification.setUser(user);
    Notification saved = notificationRepository.save(notification);
    return toResponse(saved);
  }

  /** Combine system notifications with those addressed to the given user. */
  @Transactional(readOnly = true)
  public List<NotificationResponse> getNotificationsForUser(Long userId) {
    log.info("Fetching notifications for user {}", userId);
    List<Notification> result = new ArrayList<>();
    result.addAll(notificationRepository.findBySystemLevelTrueOrderByCreatedAtDesc());
    result.addAll(notificationRepository.findByUserIdOrderByCreatedAtDesc(userId));
    result.sort((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()));
    return result.stream().map(this::toResponse).collect(Collectors.toList());
  }

  private NotificationResponse toResponse(Notification n) {
    Long uid = n.getUser() != null ? n.getUser().getId() : null;
    return new NotificationResponse(n.getId(), n.getMessage(), n.getSystemLevel(), uid);
  }
}
