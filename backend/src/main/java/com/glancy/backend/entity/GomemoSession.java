package com.glancy.backend.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.LocalDate;
import java.time.LocalDateTime;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

/**
 * Persistent record of a daily Gomemo session per user.
 */
@Entity
@Table(name = "gomemo_sessions")
@Data
@NoArgsConstructor
@EqualsAndHashCode(callSuper = true)
public class GomemoSession extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    private LocalDate sessionDate;

    @Column(nullable = false)
    private Integer dailyTarget;

    @Column(length = 256)
    private String personaDescriptor;

    @Column(length = 256)
    private String personaAudience;

    @Column(length = 128)
    private String personaTone;

    @Column(length = 1024)
    private String personaInterests;

    @Column(length = 512)
    private String goal;

    @Column(length = 1024)
    private String futurePlan;

    @Column(nullable = false)
    private Boolean completed = Boolean.FALSE;

    private LocalDateTime completedAt;

    @Column(columnDefinition = "TEXT")
    private String reviewSummary;

    @Column(columnDefinition = "TEXT")
    private String nextFocus;
}
