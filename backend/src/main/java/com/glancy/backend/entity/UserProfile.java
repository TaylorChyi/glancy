package com.glancy.backend.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Optional personalization settings for a user.
 */
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

    private String education;

    private String job;

    private String interest;

    private String goal;

    @Column(name = "current_ability", length = 1024)
    private String currentAbility;

    private Integer dailyWordTarget;

    @Column(length = 1024)
    private String futurePlan;

    @Lob
    @Column(name = "custom_sections")
    private String customSections;
}
