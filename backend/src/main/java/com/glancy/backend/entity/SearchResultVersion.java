package com.glancy.backend.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.Lob;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

/**
 * Immutable snapshot of a search result persisted for history review.
 */
@Entity
@Table(name = "search_result_versions")
@Data
@NoArgsConstructor
@EqualsAndHashCode(callSuper = true)
public class SearchResultVersion extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "search_record_id", nullable = false)
    private SearchRecord searchRecord;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "word_id")
    private Word word;

    @Column(nullable = false, length = 100)
    private String term;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private Language language;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    private DictionaryFlavor flavor = DictionaryFlavor.BILINGUAL;

    @Column(nullable = false, length = 64)
    private String model;

    @Column(name = "version_number", nullable = false)
    private Integer versionNumber;

    @Lob
    @Column(name = "content", nullable = false, columnDefinition = "TEXT")
    private String content;

    @Column(name = "preview", nullable = false, length = 255)
    private String preview;
}
