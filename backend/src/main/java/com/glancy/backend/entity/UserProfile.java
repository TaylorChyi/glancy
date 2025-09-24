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

    private Integer age;
    private String gender;
    private String job;
    private String interest;
    private String goal;
    private Integer dailyWordTarget;

    @Column(length = 1024)
    private String futurePlan;
}
