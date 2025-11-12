package com.glancy.backend.service.support;

import com.glancy.backend.dto.WordResponse;
import com.glancy.backend.entity.SearchResultVersion;
import com.glancy.backend.entity.Word;
import java.util.Objects;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

@Slf4j
@Component
public class WordPersistenceCoordinator {

  /**
   * 意图：统一执行“保存词条→同步搜索记录→持久化版本→写回个性化”的骨架流程。\ 输入： - context：封装流程依赖与外部状态；\ - strategy：决定版本内容生成方式。\
   * 输出：持久化后的实体、响应与版本。 流程： 1) 使用上下文提供的保存实现写入词条；\ 2) 在需要记录历史时同步搜索记录并生成版本内容；\ 3) 调用版本持久化实现并回写
   * versionId；\ 4) 执行个性化写回返回最终响应。 错误处理：步骤内部由上下文实现负责，协调器仅确保流程按序执行。\ 复杂度：O(1)，每个步骤均为常量时间外部调用。
   */
  public PersistenceOutcome persist(
      WordPersistenceContext context, WordVersionContentStrategy strategy) {
    validateInputs(context, strategy);
    Word savedWord = saveWord(context);
    SearchResultVersion version =
        context.captureHistory() ? persistHistory(context, strategy, savedWord) : null;
    WordResponse personalized = personalize(context);
    return new PersistenceOutcome(savedWord, personalized, version);
  }

  public record PersistenceOutcome(Word word, WordResponse response, SearchResultVersion version) {}

  public static WordPersistenceContext.Builder builder() {
    return WordPersistenceContext.builder();
  }

  private void validateInputs(WordPersistenceContext context, WordVersionContentStrategy strategy) {
    Objects.requireNonNull(context, "persistence context must not be null");
    Objects.requireNonNull(strategy, "version content strategy must not be null");
  }

  private Word saveWord(WordPersistenceContext context) {
    return context
        .saveWordStep()
        .save(context.requestedTerm(), context.response(), context.language(), context.flavor());
  }

  private SearchResultVersion persistHistory(
      WordPersistenceContext context, WordVersionContentStrategy strategy, Word savedWord) {
    context
        .recordSynchronizationStep()
        .synchronize(context.userId(), context.recordId(), savedWord.getTerm());
    String content = strategy.resolveContent(context, savedWord);
    return persistVersionIfPresent(context, savedWord, content);
  }

  private SearchResultVersion persistVersionIfPresent(
      WordPersistenceContext context, Word savedWord, String content) {
    if (content == null) {
      return null;
    }
    SearchResultVersion version =
        context
            .versionPersistStep()
            .persist(
                context.recordId(),
                context.userId(),
                context.model(),
                content,
                savedWord,
                context.flavor());
    if (version != null && version.getId() != null) {
      context.response().setVersionId(version.getId());
    }
    return version;
  }

  private WordResponse personalize(WordPersistenceContext context) {
    return context
        .personalizationStep()
        .apply(context.userId(), context.response(), context.personalizationContext());
  }
}
