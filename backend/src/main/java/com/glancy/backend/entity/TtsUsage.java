package com.glancy.backend.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import java.time.LocalDate;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

/**
 * Daily synthesis usage for a user. This entity tracks how many successful syntheses a user has
 * performed on a given date so that daily quotas can be enforced efficiently.
 */
@Entity
@Table(name = "tts_usage", uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "date"}))
@Data
@NoArgsConstructor
@EqualsAndHashCode(callSuper = true)
public class TtsUsage extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    private LocalDate date;

    @Column(nullable = false)
    private int count;
}
