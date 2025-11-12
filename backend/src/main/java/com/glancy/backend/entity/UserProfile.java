package com.glancy.backend.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import lombok.Data;
import lombok.NoArgsConstructor;

/** Optional personalization settings for a user. */
@Entity
@Table(name = "user_profiles")
@Data
@NoArgsConstructor
public class UserProfile {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @OneToOne
  @JoinColumn(name = "user_id", nullable = false, unique = true)
  private User user;

  private String job;
  private String interest;
  private String goal;
  private String education;
  private String currentAbility;
  private Integer dailyWordTarget;

  @Column(length = 1024)
  private String futurePlan;

  @Column(name = "response_style")
  private String responseStyle;

  @Column(name = "custom_sections", columnDefinition = "TEXT")
  private String customSections;
}
