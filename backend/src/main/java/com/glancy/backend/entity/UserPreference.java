package com.glancy.backend.entity;

import jakarta.persistence.*;
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

  @Enumerated(EnumType.STRING)
  @Column(nullable = false, length = 20)
  private DictionaryModel dictionaryModel = DictionaryModel.DEEPSEEK;
}
