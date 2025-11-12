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

/** Stores configurable settings for a user such as theme and language. */
@Entity
@Table(name = "user_preferences")
@Data
@NoArgsConstructor
public class UserPreference {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @OneToOne
  @JoinColumn(name = "user_id", nullable = false, unique = true)
  private User user;

  @Column(nullable = false, length = 20)
  private String theme;

  @Column(nullable = false, length = 20)
  private String systemLanguage;

  @Column(nullable = false, length = 20)
  private String searchLanguage;
}
