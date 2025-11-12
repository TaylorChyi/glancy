package com.glancy.backend.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import java.time.LocalDateTime;
import java.util.Objects;

/**
 * Stores subscription, suppression, and engagement state for an email address on a specific stream.
 */
@Entity
@Table(
    name = "email_audience",
    uniqueConstraints = @UniqueConstraint(columnNames = {"email", "stream"}))
public class EmailAudience {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(nullable = false, length = 320)
  private String email;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false, length = 32)
  private EmailStream stream;

  @Column(nullable = false)
  private Boolean subscribed = Boolean.TRUE;

  @Column(nullable = false)
  private LocalDateTime subscribedAt;

  private LocalDateTime unsubscribedAt;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false, length = 32)
  private EmailSuppressionStatus suppressionStatus = EmailSuppressionStatus.NONE;

  @Column(length = 512)
  private String suppressionDetail;

  private LocalDateTime suppressionUpdatedAt;

  private LocalDateTime lastDeliveredAt;

  private LocalDateTime lastInteractionAt;

  private LocalDateTime lastBounceAt;

  @Column(nullable = false)
  private Integer softBounceCount = 0;

  @Column(nullable = false)
  private Integer hardBounceCount = 0;

  @Column(nullable = false)
  private LocalDateTime createdAt;

  @Column(nullable = false)
  private LocalDateTime updatedAt;

  public EmailAudience() {}

  public EmailAudience(String email, EmailStream stream, LocalDateTime now) {
    this.email = Objects.requireNonNull(email, "email");
    this.stream = Objects.requireNonNull(stream, "stream");
    this.subscribedAt = now;
    this.lastInteractionAt = now;
    this.createdAt = now;
    this.updatedAt = now;
  }

  @PrePersist
  void onCreate() {
    LocalDateTime now = LocalDateTime.now();
    if (createdAt == null) {
      createdAt = now;
    }
    if (updatedAt == null) {
      updatedAt = now;
    }
    if (subscribedAt == null) {
      subscribedAt = now;
    }
    if (lastInteractionAt == null) {
      lastInteractionAt = now;
    }
  }

  @PreUpdate
  void onUpdate() {
    updatedAt = LocalDateTime.now();
  }

  public Long getId() {
    return id;
  }

  public String getEmail() {
    return email;
  }

  public EmailStream getStream() {
    return stream;
  }

  public Boolean getSubscribed() {
    return subscribed;
  }

  public void setSubscribed(boolean subscribed, LocalDateTime timestamp) {
    this.subscribed = subscribed;
    if (subscribed) {
      this.subscribedAt = timestamp;
      this.unsubscribedAt = null;
    } else {
      this.unsubscribedAt = timestamp;
    }
    touch(timestamp);
  }

  public LocalDateTime getSubscribedAt() {
    return subscribedAt;
  }

  public LocalDateTime getUnsubscribedAt() {
    return unsubscribedAt;
  }

  public EmailSuppressionStatus getSuppressionStatus() {
    return suppressionStatus;
  }

  public void setSuppressionStatus(
      EmailSuppressionStatus suppressionStatus, String detail, LocalDateTime timestamp) {
    this.suppressionStatus = Objects.requireNonNull(suppressionStatus, "suppressionStatus");
    this.suppressionDetail = detail;
    this.suppressionUpdatedAt = timestamp;
    touch(timestamp);
  }

  public String getSuppressionDetail() {
    return suppressionDetail;
  }

  public LocalDateTime getSuppressionUpdatedAt() {
    return suppressionUpdatedAt;
  }

  public LocalDateTime getLastDeliveredAt() {
    return lastDeliveredAt;
  }

  public void markDelivered(LocalDateTime timestamp) {
    this.lastDeliveredAt = timestamp;
    this.lastInteractionAt = timestamp;
    touch(timestamp);
  }

  public LocalDateTime getLastInteractionAt() {
    return lastInteractionAt;
  }

  public void registerInteraction(LocalDateTime timestamp) {
    this.lastInteractionAt = timestamp;
    touch(timestamp);
  }

  public LocalDateTime getLastBounceAt() {
    return lastBounceAt;
  }

  public void registerBounce(boolean permanent, LocalDateTime timestamp) {
    this.lastBounceAt = timestamp;
    if (permanent) {
      hardBounceCount = hardBounceCount + 1;
    } else {
      softBounceCount = softBounceCount + 1;
    }
    touch(timestamp);
  }

  public Integer getSoftBounceCount() {
    return softBounceCount;
  }

  public Integer getHardBounceCount() {
    return hardBounceCount;
  }

  public LocalDateTime getCreatedAt() {
    return createdAt;
  }

  public LocalDateTime getUpdatedAt() {
    return updatedAt;
  }

  private void touch(LocalDateTime timestamp) {
    this.updatedAt = timestamp;
    if (lastInteractionAt == null) {
      lastInteractionAt = timestamp;
    }
  }
}
