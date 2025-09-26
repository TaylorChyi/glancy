package com.glancy.backend.entity;

import jakarta.persistence.*;
import java.util.ArrayList;
import java.util.List;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

/**
 * Dictionary word entry cached from the external service.
 */
@Entity
@Table(
    name = "words",
    uniqueConstraints = @UniqueConstraint(columnNames = { "term", "language", "flavor" })
)
@Data
@NoArgsConstructor
@EqualsAndHashCode(callSuper = true)
public class Word extends BaseEntity {

    @Column(nullable = false, length = 100)
    private String term;

    @ElementCollection
    @CollectionTable(name = "word_definitions", joinColumns = @JoinColumn(name = "word_id"))
    @Column(name = "definition", nullable = false, columnDefinition = "TEXT")
    private List<String> definitions = new ArrayList<>();

    @ElementCollection
    @CollectionTable(name = "word_variations", joinColumns = @JoinColumn(name = "word_id"))
    @Column(name = "variation", nullable = false, columnDefinition = "TEXT")
    private List<String> variations = new ArrayList<>();

    @ElementCollection
    @CollectionTable(name = "word_synonyms", joinColumns = @JoinColumn(name = "word_id"))
    @Column(name = "synonym", nullable = false, columnDefinition = "TEXT")
    private List<String> synonyms = new ArrayList<>();

    @ElementCollection
    @CollectionTable(name = "word_antonyms", joinColumns = @JoinColumn(name = "word_id"))
    @Column(name = "antonym", nullable = false, columnDefinition = "TEXT")
    private List<String> antonyms = new ArrayList<>();

    @ElementCollection
    @CollectionTable(name = "word_related_terms", joinColumns = @JoinColumn(name = "word_id"))
    @Column(name = "related_term", nullable = false, columnDefinition = "TEXT")
    private List<String> related = new ArrayList<>();

    @ElementCollection
    @CollectionTable(name = "word_phrases", joinColumns = @JoinColumn(name = "word_id"))
    @Column(name = "phrase", nullable = false, columnDefinition = "TEXT")
    private List<String> phrases = new ArrayList<>();

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private Language language;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    private DictionaryFlavor flavor = DictionaryFlavor.BILINGUAL;

    @Column(length = 100)
    private String phonetic;

    @Column
    private String example;

    @Column(name = "markdown", columnDefinition = "TEXT")
    private String markdown;
}
