package com.glancy.backend.service.support;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.glancy.backend.dto.WordPersonalizationContext;
import com.glancy.backend.dto.WordResponse;
import com.glancy.backend.entity.DictionaryFlavor;
import com.glancy.backend.entity.Language;
import com.glancy.backend.entity.SearchResultVersion;
import com.glancy.backend.entity.Word;
import java.util.Objects;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.experimental.Accessors;

@Getter
@Accessors(fluent = true)
public final class WordPersistenceContext {

  private final Long userId;
  private final String requestedTerm;
  private final Language language;
  private final DictionaryFlavor flavor;
  private final String model;
  private final boolean captureHistory;
  private final Long recordId;
  private final WordResponse response;
  private final WordPersonalizationContext personalizationContext;

  @Getter(AccessLevel.PACKAGE)
  private final SaveWordStep saveWordStep;

  @Getter(AccessLevel.PACKAGE)
  private final RecordSynchronizationStep recordSynchronizationStep;

  @Getter(AccessLevel.PACKAGE)
  private final VersionPersistStep versionPersistStep;

  @Getter(AccessLevel.PACKAGE)
  private final PersonalizationStep personalizationStep;

  @Getter(AccessLevel.NONE)
  private final WordSerializationStep wordSerializationStep;

  private final String sanitizedMarkdown;

  private WordPersistenceContext(Builder builder) {
    this.userId = Objects.requireNonNull(builder.userId, "userId must not be null");
    this.requestedTerm =
        Objects.requireNonNull(builder.requestedTerm, "requestedTerm must not be null");
    this.language = Objects.requireNonNull(builder.language, "language must not be null");
    this.flavor = Objects.requireNonNull(builder.flavor, "flavor must not be null");
    this.model = Objects.requireNonNull(builder.model, "model must not be null");
    this.captureHistory = builder.captureHistory;
    this.recordId = builder.recordId;
    this.response = Objects.requireNonNull(builder.response, "response must not be null");
    this.personalizationContext = builder.personalizationContext;
    this.saveWordStep =
        Objects.requireNonNull(builder.saveWordStep, "saveWordStep must not be null");
    this.recordSynchronizationStep =
        Objects.requireNonNull(
            builder.recordSynchronizationStep, "recordSynchronizationStep must not be null");
    this.versionPersistStep =
        Objects.requireNonNull(builder.versionPersistStep, "versionPersistStep must not be null");
    this.personalizationStep =
        Objects.requireNonNull(builder.personalizationStep, "personalizationStep must not be null");
    this.wordSerializationStep =
        Objects.requireNonNull(
            builder.wordSerializationStep, "wordSerializationStep must not be null");
    this.sanitizedMarkdown = builder.sanitizedMarkdown;
  }

  public static Builder builder() {
    return new Builder();
  }

  public String serializeWord(Word word) throws JsonProcessingException {
    return wordSerializationStep.serialize(word);
  }

  public static final class Builder {

    private Long userId;
    private String requestedTerm;
    private Language language;
    private DictionaryFlavor flavor;
    private String model;
    private boolean captureHistory;
    private Long recordId;
    private WordResponse response;
    private WordPersonalizationContext personalizationContext;
    private SaveWordStep saveWordStep;
    private RecordSynchronizationStep recordSynchronizationStep;
    private VersionPersistStep versionPersistStep;
    private PersonalizationStep personalizationStep;
    private WordSerializationStep wordSerializationStep;
    private String sanitizedMarkdown;

    public Builder userId(Long userId) {
      this.userId = userId;
      return this;
    }

    public Builder requestedTerm(String requestedTerm) {
      this.requestedTerm = requestedTerm;
      return this;
    }

    public Builder language(Language language) {
      this.language = language;
      return this;
    }

    public Builder flavor(DictionaryFlavor flavor) {
      this.flavor = flavor;
      return this;
    }

    public Builder model(String model) {
      this.model = model;
      return this;
    }

    public Builder captureHistory(boolean captureHistory) {
      this.captureHistory = captureHistory;
      return this;
    }

    public Builder recordId(Long recordId) {
      this.recordId = recordId;
      return this;
    }

    public Builder response(WordResponse response) {
      this.response = response;
      return this;
    }

    public Builder personalizationContext(WordPersonalizationContext personalizationContext) {
      this.personalizationContext = personalizationContext;
      return this;
    }

    public Builder saveWordStep(SaveWordStep saveWordStep) {
      this.saveWordStep = saveWordStep;
      return this;
    }

    public Builder recordSynchronizationStep(RecordSynchronizationStep recordSynchronizationStep) {
      this.recordSynchronizationStep = recordSynchronizationStep;
      return this;
    }

    public Builder versionPersistStep(VersionPersistStep versionPersistStep) {
      this.versionPersistStep = versionPersistStep;
      return this;
    }

    public Builder personalizationStep(PersonalizationStep personalizationStep) {
      this.personalizationStep = personalizationStep;
      return this;
    }

    public Builder wordSerializationStep(WordSerializationStep wordSerializationStep) {
      this.wordSerializationStep = wordSerializationStep;
      return this;
    }

    public Builder sanitizedMarkdown(String sanitizedMarkdown) {
      this.sanitizedMarkdown = sanitizedMarkdown;
      return this;
    }

    public WordPersistenceContext build() {
      return new WordPersistenceContext(this);
    }
  }

  @FunctionalInterface
  public interface SaveWordStep {
    Word save(
        String requestedTerm, WordResponse response, Language language, DictionaryFlavor flavor);
  }

  @FunctionalInterface
  public interface RecordSynchronizationStep {
    void synchronize(Long userId, Long recordId, String canonicalTerm);
  }

  @FunctionalInterface
  public interface VersionPersistStep {
    SearchResultVersion persist(
        Long recordId,
        Long userId,
        String model,
        String content,
        Word word,
        DictionaryFlavor flavor);
  }

  @FunctionalInterface
  public interface PersonalizationStep {
    WordResponse apply(Long userId, WordResponse response, WordPersonalizationContext context);
  }

  @FunctionalInterface
  public interface WordSerializationStep {
    String serialize(Word word) throws JsonProcessingException;
  }
}
