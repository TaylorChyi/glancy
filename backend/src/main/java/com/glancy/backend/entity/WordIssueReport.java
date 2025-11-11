package com.glancy.backend.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "word_issue_reports")
@Getter
@Setter
@NoArgsConstructor
public class WordIssueReport extends BaseEntity {

    @Column(nullable = false, length = 120)
    private String term;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    private Language language;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    private DictionaryFlavor flavor;

    @Enumerated(EnumType.STRING)
    @Column(name = "issue_category", nullable = false, length = 40)
    private WordIssueCategory category;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "source_url", length = 500)
    private String sourceUrl;

    @Column(name = "report_user_id")
    private Long userId;
}
