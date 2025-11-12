package com.glancy.backend.service.support;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.glancy.backend.dto.PersonalizedWordExplanation;
import com.glancy.backend.dto.WordPersonalizationContext;
import com.glancy.backend.dto.WordResponse;
import com.glancy.backend.entity.DictionaryFlavor;
import com.glancy.backend.entity.Language;
import com.glancy.backend.entity.SearchResultVersion;
import com.glancy.backend.entity.Word;
import com.glancy.backend.util.SensitiveDataUtil;
import java.util.List;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.atomic.AtomicReference;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

/** 针对 WordPersistenceCoordinator 的流程编排验证。 */
class WordPersistenceCoordinatorTest {

  private final WordPersistenceCoordinator coordinator = new WordPersistenceCoordinator();

  /**
   * 测试目标：验证同步流程复用响应 markdown 并写回个性化。\ 前置条件：\ - 上下文包含有效的搜索记录 ID 与 markdown；\ - 所有协作步骤均成功执行。\ 步骤：\ 1)
   * 构建上下文并执行 persist；\ 2) 记录同步与版本持久化返回模拟对象。\ 断言：\ - 记录同步被触发；\ - 版本内容复用了响应 markdown；\ - versionId
   * 被写回响应且个性化结果不为空。\ 边界/异常：\ - 若任一步骤未执行，将导致断言失败。\
   */
  @Test
  void persistSyncFlow_ReusesResponseMarkdown() {
    AtomicBoolean recordSynced = new AtomicBoolean(false);
    AtomicReference<String> versionContent = new AtomicReference<>();

    WordPersistenceContext context = buildSyncContext(recordSynced, versionContent);

    WordPersistenceCoordinator.PersistenceOutcome outcome =
        coordinator.persist(context, new ResponseMarkdownOrSerializedWordStrategy());

    Assertions.assertTrue(recordSynced.get(), "应同步搜索记录");
    Assertions.assertEquals("### definition", versionContent.get(), "版本内容应复用响应 markdown");
    Assertions.assertEquals(99L, outcome.response().getVersionId(), "versionId 应写回响应");
  }

  @Test
  void persistSyncFlow_WritesPersonalizationResult() {
    AtomicBoolean personalized = new AtomicBoolean(false);

    WordPersistenceContext context = buildPersonalizationContext(personalized);

    WordPersistenceCoordinator.PersistenceOutcome outcome =
        coordinator.persist(context, new ResponseMarkdownOrSerializedWordStrategy());

    Assertions.assertTrue(personalized.get(), "应执行个性化回写");
    Assertions.assertNotNull(outcome.response().getPersonalization(), "应写入个性化结果");
  }

  /**
   * 测试目标：验证流式策略使用净化 markdown。\ 前置条件：\ - 上下文提供净化后的 markdown；\ - 保存后的词条 markdown 与净化文本不同以便区分。\ 步骤：\
   * 1) 执行 persist 并捕获版本内容；\ 2) 通过策略选择流式净化文本。\ 断言：\ - 版本内容等于净化 markdown；\ - 个性化步骤仍被执行。\ 边界/异常：\ -
   * 若净化文本缺失则会触发策略回退，此处不覆盖。\
   */
  @Test
  void persistStreamingFlow_UsesSanitizedMarkdown() {
    AtomicReference<String> versionContent = new AtomicReference<>();
    AtomicBoolean personalized = new AtomicBoolean(false);

    WordPersistenceContext context = buildStreamingContext(versionContent, personalized);

    WordVersionContentStrategy strategy = new SanitizedStreamingMarkdownStrategy();
    WordPersistenceCoordinator.PersistenceOutcome outcome = coordinator.persist(context, strategy);

    Assertions.assertEquals("## sanitized output", versionContent.get(), "版本内容应取净化 markdown");
    Assertions.assertTrue(personalized.get(), "应执行个性化回写");
    Assertions.assertEquals(11L, outcome.response().getVersionId(), "应写入版本 ID");
  }

  /**
   * 测试目标：验证序列化失败时回退为 markdown 预览。\ 前置条件：\ - 响应未提供 markdown；\ - 序列化函数抛出异常。\ 步骤：\ 1) 构建上下文并触发持久化；\ 2)
   * 捕获版本内容。\ 断言：\ - 版本内容等于词条 markdown 的预览值；\ - versionId 同样被写回响应。\ 边界/异常：\ - 若预览值为空说明策略回退失败。\
   */
  @Test
  void persistSyncFlow_FallbacksToPreviewWhenSerializationFails() {
    AtomicReference<String> versionContent = new AtomicReference<>();

    WordPersistenceContext context = buildSerializationFailureContext(versionContent);

    WordVersionContentStrategy strategy = new ResponseMarkdownOrSerializedWordStrategy();
    WordPersistenceCoordinator.PersistenceOutcome outcome = coordinator.persist(context, strategy);

    String expectedPreview = SensitiveDataUtil.previewText("markdown-content-with-length");
    Assertions.assertEquals(expectedPreview, versionContent.get(), "序列化失败时应回退到 markdown 预览");
    Assertions.assertEquals(21L, outcome.response().getVersionId(), "versionId 仍需写回响应");
  }

  private WordPersistenceContext buildSyncContext(
      AtomicBoolean recordSynced, AtomicReference<String> versionContent) {
    return baseContextBuilder()
        .response(responseWithMarkdown("### definition"))
        .saveWordStep(
            (requested, resp, language, flavor) -> savedWord("canonical", language, flavor, resp))
        .recordSynchronizationStep(
            (userId, recordId, canonicalTerm) -> {
              Assertions.assertEquals(1L, userId);
              Assertions.assertEquals(2L, recordId);
              Assertions.assertEquals("canonical", canonicalTerm);
              recordSynced.set(true);
            })
        .versionPersistStep(
            (recordId, userId, model, content, word, flavor) ->
                versionCapture(versionContent, content, 99L))
        .personalizationStep((userId, resp, ctx) -> resp)
        .wordSerializationStep(word -> "serialized")
        .sanitizedMarkdown(null)
        .build();
  }

  private WordPersistenceContext buildPersonalizationContext(AtomicBoolean personalized) {
    return baseContextBuilder()
        .response(responseWithMarkdown("### definition"))
        .personalizationContext(
            new WordPersonalizationContext(null, false, null, null, null, List.of(), List.of()))
        .saveWordStep(
            (requested, resp, language, flavor) -> savedWord("canonical", language, flavor, resp))
        .recordSynchronizationStep((userId, recordId, canonicalTerm) -> {})
        .versionPersistStep(
            (recordId, userId, model, content, word, flavor) ->
                versionCapture(new AtomicReference<>(), content, 88L))
        .personalizationStep(
            (userId, resp, ctx) -> {
              personalized.set(true);
              resp.setPersonalization(
                  new PersonalizedWordExplanation(
                      "persona", "takeaway", "context", List.of(), List.of()));
              return resp;
            })
        .wordSerializationStep(word -> "serialized")
        .sanitizedMarkdown(null)
        .build();
  }

  private WordPersistenceContext buildStreamingContext(
      AtomicReference<String> versionContent, AtomicBoolean personalized) {
    return baseContextBuilder()
        .model("streaming-model")
        .saveWordStep(
            (requested, resp, language, flavor) -> {
              Word word = new Word();
              word.setTerm("term");
              word.setMarkdown("persisted-markdown");
              return word;
            })
        .recordSynchronizationStep((userId, recordId, canonicalTerm) -> {})
        .versionPersistStep(
            (recordId, userId, model, content, word, flavor) ->
                versionCapture(versionContent, content, 11L))
        .personalizationStep(
            (userId, resp, ctx) -> {
              personalized.set(true);
              return resp;
            })
        .wordSerializationStep(word -> "unused")
        .sanitizedMarkdown("## sanitized output")
        .build();
  }

  private WordPersistenceContext buildSerializationFailureContext(
      AtomicReference<String> versionContent) {
    return baseContextBuilder()
        .saveWordStep(
            (requested, resp, language, flavor) -> {
              Word word = new Word();
              word.setTerm("fallback");
              word.setMarkdown("markdown-content-with-length");
              return word;
            })
        .recordSynchronizationStep((userId, recordId, canonicalTerm) -> {})
        .versionPersistStep(
            (recordId, userId, model, content, word, flavor) ->
                versionCapture(versionContent, content, 21L))
        .personalizationStep((userId, resp, ctx) -> resp)
        .wordSerializationStep(
            word -> {
              throw new JsonProcessingException("boom") {};
            })
        .sanitizedMarkdown(null)
        .build();
  }

  private WordPersistenceContext.Builder baseContextBuilder() {
    return WordPersistenceCoordinator.builder()
        .userId(1L)
        .requestedTerm("term")
        .language(Language.ENGLISH)
        .flavor(DictionaryFlavor.BILINGUAL)
        .model("model")
        .recordId(2L)
        .captureHistory(true)
        .response(new WordResponse());
  }

  private WordResponse responseWithMarkdown(String markdown) {
    WordResponse response = new WordResponse();
    response.setMarkdown(markdown);
    return response;
  }

  private Word savedWord(
      String term, Language language, DictionaryFlavor flavor, WordResponse resp) {
    Word word = new Word();
    word.setTerm(term);
    word.setLanguage(language);
    word.setFlavor(flavor);
    word.setMarkdown(resp.getMarkdown());
    return word;
  }

  private SearchResultVersion versionCapture(
      AtomicReference<String> holder, String content, long id) {
    holder.set(content);
    SearchResultVersion version = new SearchResultVersion();
    version.setId(id);
    return version;
  }
}
