package com.glancy.backend.service.support;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.glancy.backend.dto.WordPersonalizationContext;
import com.glancy.backend.dto.WordResponse;
import com.glancy.backend.entity.DictionaryFlavor;
import com.glancy.backend.entity.Language;
import com.glancy.backend.entity.SearchResultVersion;
import com.glancy.backend.entity.Word;
import java.util.Objects;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

/**
 * 背景：
 *  - WordService 在同步与流式路径中都需要执行保存词条、记录同步、版本化与个性化回写的相同步骤。
 * 目的：
 *  - 以模板方法封装持久化协作流程，消除 WordService 中分支复制的编排逻辑。
 * 关键决策与取舍：
 *  - 选用模板方法而非责任链：流程步骤顺序固定且存在状态依赖（需先保存词条再同步记录），模板方法可显式表达骨架；
 *  - 通过函数式依赖注入各步骤实现，避免协调器直接依赖具体仓储，降低与 WordService 的耦合，取舍是上下文构造略显繁琐。
 * 影响范围：
 *  - WordService 将通过 PersistenceContext 提供具体操作；
 *  - SearchResultService 与个性化逻辑通过回调方式被统一调度。
 * 演进与TODO：
 *  - 后续可引入指标埋点或重试策略，只需在对应 step 中扩展实现；
 *  - 若持久化流程出现新的分支，可在策略接口中扩展版本内容生成逻辑。
 */
@Slf4j
@Component
public class WordPersistenceCoordinator {

    /**
     * 意图：统一执行“保存词条→同步搜索记录→持久化版本→写回个性化”的骨架流程。\
     * 输入：
     *  - context：封装流程依赖与外部状态；\
     *  - strategy：决定版本内容生成方式。\
     * 输出：持久化后的实体、响应与版本。
     * 流程：
     *  1) 使用上下文提供的保存实现写入词条；\
     *  2) 在需要记录历史时同步搜索记录并生成版本内容；\
     *  3) 调用版本持久化实现并回写 versionId；\
     *  4) 执行个性化写回返回最终响应。
     * 错误处理：步骤内部由上下文实现负责，协调器仅确保流程按序执行。\
     * 复杂度：O(1)，每个步骤均为常量时间外部调用。
     */
    public PersistenceOutcome persist(PersistenceContext context, WordVersionContentStrategy strategy) {
        Objects.requireNonNull(context, "persistence context must not be null");
        Objects.requireNonNull(strategy, "version content strategy must not be null");

        Word savedWord = context.saveWordStep.save(
            context.requestedTerm,
            context.response,
            context.language,
            context.flavor
        );

        SearchResultVersion version = null;
        if (context.captureHistory) {
            context.recordSynchronizationStep.synchronize(context.userId, context.recordId, savedWord.getTerm());
            String content = strategy.resolveContent(context, savedWord);
            if (content != null) {
                version = context.versionPersistStep.persist(
                    context.recordId,
                    context.userId,
                    context.model,
                    content,
                    savedWord,
                    context.flavor
                );
                if (version != null && version.getId() != null) {
                    context.response.setVersionId(version.getId());
                }
            }
        }

        WordResponse personalized = context.personalizationStep.apply(
            context.userId,
            context.response,
            context.personalizationContext
        );
        return new PersistenceOutcome(savedWord, personalized, version);
    }

    public record PersistenceOutcome(Word word, WordResponse response, SearchResultVersion version) {}

    public static Builder builder() {
        return new Builder();
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

        private Builder() {}

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

        public PersistenceContext build() {
            return new PersistenceContext(this);
        }
    }

    public static final class PersistenceContext {

        private final Long userId;
        private final String requestedTerm;
        private final Language language;
        private final DictionaryFlavor flavor;
        private final String model;
        private final boolean captureHistory;
        private final Long recordId;
        private final WordResponse response;
        private final WordPersonalizationContext personalizationContext;
        private final SaveWordStep saveWordStep;
        private final RecordSynchronizationStep recordSynchronizationStep;
        private final VersionPersistStep versionPersistStep;
        private final PersonalizationStep personalizationStep;
        private final WordSerializationStep wordSerializationStep;
        private final String sanitizedMarkdown;

        private PersistenceContext(Builder builder) {
            this.userId = Objects.requireNonNull(builder.userId, "userId must not be null");
            this.requestedTerm = Objects.requireNonNull(builder.requestedTerm, "requestedTerm must not be null");
            this.language = Objects.requireNonNull(builder.language, "language must not be null");
            this.flavor = Objects.requireNonNull(builder.flavor, "flavor must not be null");
            this.model = Objects.requireNonNull(builder.model, "model must not be null");
            this.captureHistory = builder.captureHistory;
            this.recordId = builder.recordId;
            this.response = Objects.requireNonNull(builder.response, "response must not be null");
            this.personalizationContext = builder.personalizationContext;
            this.saveWordStep = Objects.requireNonNull(builder.saveWordStep, "saveWordStep must not be null");
            this.recordSynchronizationStep = Objects.requireNonNull(
                builder.recordSynchronizationStep,
                "recordSynchronizationStep must not be null"
            );
            this.versionPersistStep = Objects.requireNonNull(
                builder.versionPersistStep,
                "versionPersistStep must not be null"
            );
            this.personalizationStep = Objects.requireNonNull(
                builder.personalizationStep,
                "personalizationStep must not be null"
            );
            this.wordSerializationStep = Objects.requireNonNull(
                builder.wordSerializationStep,
                "wordSerializationStep must not be null"
            );
            this.sanitizedMarkdown = builder.sanitizedMarkdown;
        }

        public Long userId() {
            return userId;
        }

        public String requestedTerm() {
            return requestedTerm;
        }

        public Language language() {
            return language;
        }

        public DictionaryFlavor flavor() {
            return flavor;
        }

        public String model() {
            return model;
        }

        public boolean captureHistory() {
            return captureHistory;
        }

        public Long recordId() {
            return recordId;
        }

        public WordResponse response() {
            return response;
        }

        public WordPersonalizationContext personalizationContext() {
            return personalizationContext;
        }

        public String sanitizedMarkdown() {
            return sanitizedMarkdown;
        }

        public String serializeWord(Word word) throws JsonProcessingException {
            return wordSerializationStep.serialize(word);
        }
    }

    @FunctionalInterface
    public interface SaveWordStep {
        Word save(String requestedTerm, WordResponse response, Language language, DictionaryFlavor flavor);
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
            DictionaryFlavor flavor
        );
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
