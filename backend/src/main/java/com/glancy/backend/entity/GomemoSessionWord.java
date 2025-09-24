package com.glancy.backend.entity;

import com.glancy.backend.gomemo.model.GomemoStudyModeType;
import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

/**
 * Stores the curated words associated with a Gomemo session to ensure
 * deterministic plans across repeated fetches.
 */
@Entity
@Table(name = "gomemo_session_words")
@Data
@NoArgsConstructor
@EqualsAndHashCode(callSuper = true)
public class GomemoSessionWord extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "session_id", nullable = false)
    private GomemoSession session;

    @Column(nullable = false, length = 128)
    private String term;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    private Language language;

    @Column(nullable = false)
    private Integer priorityScore;

    @ElementCollection
    @CollectionTable(name = "gomemo_session_word_rationales", joinColumns = @JoinColumn(name = "session_word_id"))
    @Column(name = "rationale", length = 512, nullable = false)
    private List<String> rationales = new ArrayList<>();

    @ElementCollection(targetClass = GomemoStudyModeType.class)
    @CollectionTable(name = "gomemo_session_word_modes", joinColumns = @JoinColumn(name = "session_word_id"))
    @Enumerated(EnumType.STRING)
    @Column(name = "mode", length = 64, nullable = false)
    private Set<GomemoStudyModeType> recommendedModes = new LinkedHashSet<>();
}
