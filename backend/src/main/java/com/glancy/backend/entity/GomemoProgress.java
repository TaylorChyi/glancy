package com.glancy.backend.entity;

import com.glancy.backend.gomemo.model.GomemoStudyModeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

/**
 * Tracks detailed practice signals for a Gomemo session.
 */
@Entity
@Table(name = "gomemo_progress_entries")
@Data
@NoArgsConstructor
@EqualsAndHashCode(callSuper = true)
public class GomemoProgress extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "session_id", nullable = false)
    private GomemoSession session;

    @Column(nullable = false, length = 128)
    private String term;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    private Language language;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 64)
    private GomemoStudyModeType mode;

    @Column(nullable = false)
    private Integer attempts;

    @Column(nullable = false)
    private Integer successes;

    @Column(nullable = false)
    private Double retentionScore;

    @Column(length = 1024)
    private String note;
}
