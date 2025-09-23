package com.glancy.backend.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

/**
 * Historical snapshot of model responses for a given search record.
 */
@Entity
@Table(
    name = "search_result_versions",
    indexes = {
        @Index(name = "idx_search_result_versions_record", columnList = "search_record_id"),
        @Index(name = "idx_search_result_versions_user", columnList = "user_id"),
    }
)
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

    @Column(nullable = false, length = 100)
    private String model;

    @Column(name = "version_number", nullable = false)
    private Long versionNumber;

    @Column(name = "content", columnDefinition = "LONGTEXT", nullable = false)
    private String content;

    @Column(name = "preview", length = 255)
    private String preview;
}
