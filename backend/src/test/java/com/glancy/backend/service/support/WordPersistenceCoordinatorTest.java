package com.glancy.backend.service.support;

import static org.junit.jupiter.api.Assertions.*;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.glancy.backend.dto.word.PersonalizedWordExplanation;
import com.glancy.backend.dto.word.WordPersonalizationContext;
import com.glancy.backend.dto.word.WordResponse;
import com.glancy.backend.entity.DictionaryFlavor;
import com.glancy.backend.entity.Language;
import com.glancy.backend.entity.SearchResultVersion;
import com.glancy.backend.entity.Word;
import com.glancy.backend.util.SensitiveDataUtil;
import java.util.List;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.atomic.AtomicReference;
import org.junit.jupiter.api.Test;

/**
 * 针对 WordPersistenceCoordinator 的流程编排验证。
 */
class WordPersistenceCoordinatorTest {

    private final WordPersistenceCoordinator coordinator = new WordPersistenceCoordinator();

    /**
     * 测试目标：验证同步流程复用响应 markdown 并写回个性化。\
     * 前置条件：\
     *  - 上下文包含有效的搜索记录 ID 与 markdown；\
     *  - 所有协作步骤均成功执行。\
     * 步骤：\
     *  1) 构建上下文并执行 persist；\
     *  2) 记录同步与版本持久化返回模拟对象。\
     * 断言：\
     *  - 记录同步被触发；\
     *  - 版本内容复用了响应 markdown；\
     *  - versionId 被写回响应且个性化结果不为空。\
     * 边界/异常：\
     *  - 若任一步骤未执行，将导致断言失败。\
     */
    @Test
    void persistSyncFlow_ReuseResponseMarkdownAndApplyPersonalization() {
        WordResponse response = new WordResponse();
        response.setMarkdown("### definition");
        AtomicBoolean recordSynced = new AtomicBoolean(false);
        AtomicReference<String> versionContent = new AtomicReference<>();

        WordPersistenceCoordinator.PersistenceContext context = WordPersistenceCoordinator.builder()
            .userId(1L)
            .requestedTerm("raw")
            .language(Language.ENGLISH)
            .flavor(DictionaryFlavor.BILINGUAL)
            .model("model")
            .recordId(2L)
            .captureHistory(true)
            .response(response)
            .personalizationContext(new WordPersonalizationContext(null, false, null, null, null, List.of(), List.of()))
            .saveWordStep((requested, resp, language, flavor) -> {
                Word word = new Word();
                word.setTerm("canonical");
                word.setLanguage(language);
                word.setFlavor(flavor);
                word.setMarkdown(resp.getMarkdown());
                return word;
            })
            .recordSynchronizationStep((userId, recordId, canonicalTerm) -> {
                assertEquals(1L, userId, "用户 ID 应按上下文透传");
                assertEquals(2L, recordId, "记录 ID 应保持一致");
                assertEquals("canonical", canonicalTerm, "规范词条需来自保存结果");
                recordSynced.set(true);
            })
            .versionPersistStep((recordId, userId, model, content, word, flavor) -> {
                versionContent.set(content);
                SearchResultVersion version = new SearchResultVersion();
                version.setId(99L);
                return version;
            })
            .personalizationStep((userId, resp, context1) -> {
                resp.setPersonalization(
                    new PersonalizedWordExplanation("persona", "takeaway", "context", List.of(), List.of())
                );
                return resp;
            })
            .wordSerializationStep(word -> "serialized")
            .sanitizedMarkdown(null)
            .build();

        WordVersionContentStrategy strategy = new ResponseMarkdownOrSerializedWordStrategy();
        WordPersistenceCoordinator.PersistenceOutcome outcome = coordinator.persist(context, strategy);

        assertTrue(recordSynced.get(), "应同步搜索记录");
        assertEquals("### definition", versionContent.get(), "版本内容应复用响应 markdown");
        assertEquals(99L, outcome.response().getVersionId(), "versionId 应写回响应");
        assertNotNull(outcome.response().getPersonalization(), "应写入个性化结果");
    }

    /**
     * 测试目标：验证流式策略使用净化 markdown。\
     * 前置条件：\
     *  - 上下文提供净化后的 markdown；\
     *  - 保存后的词条 markdown 与净化文本不同以便区分。\
     * 步骤：\
     *  1) 执行 persist 并捕获版本内容；\
     *  2) 通过策略选择流式净化文本。\
     * 断言：\
     *  - 版本内容等于净化 markdown；\
     *  - 个性化步骤仍被执行。\
     * 边界/异常：\
     *  - 若净化文本缺失则会触发策略回退，此处不覆盖。\
     */
    @Test
    void persistStreamingFlow_UsesSanitizedMarkdown() {
        WordResponse response = new WordResponse();
        AtomicReference<String> versionContent = new AtomicReference<>();
        AtomicBoolean personalized = new AtomicBoolean(false);

        WordPersistenceCoordinator.PersistenceContext context = WordPersistenceCoordinator.builder()
            .userId(5L)
            .requestedTerm("term")
            .language(Language.ENGLISH)
            .flavor(DictionaryFlavor.BILINGUAL)
            .model("streaming-model")
            .recordId(7L)
            .captureHistory(true)
            .response(response)
            .personalizationContext(null)
            .saveWordStep((requested, resp, language, flavor) -> {
                Word word = new Word();
                word.setTerm("term");
                word.setMarkdown("persisted-markdown");
                return word;
            })
            .recordSynchronizationStep((userId, recordId, canonicalTerm) -> {})
            .versionPersistStep((recordId, userId, model, content, word, flavor) -> {
                versionContent.set(content);
                SearchResultVersion version = new SearchResultVersion();
                version.setId(11L);
                return version;
            })
            .personalizationStep((userId, resp, context1) -> {
                personalized.set(true);
                return resp;
            })
            .wordSerializationStep(word -> "unused")
            .sanitizedMarkdown("## sanitized output")
            .build();

        WordVersionContentStrategy strategy = new SanitizedStreamingMarkdownStrategy();
        WordPersistenceCoordinator.PersistenceOutcome outcome = coordinator.persist(context, strategy);

        assertEquals("## sanitized output", versionContent.get(), "版本内容应取净化 markdown");
        assertTrue(personalized.get(), "应执行个性化回写");
        assertEquals(11L, outcome.response().getVersionId(), "应写入版本 ID");
    }

    /**
     * 测试目标：验证序列化失败时回退为 markdown 预览。\
     * 前置条件：\
     *  - 响应未提供 markdown；\
     *  - 序列化函数抛出异常。\
     * 步骤：\
     *  1) 构建上下文并触发持久化；\
     *  2) 捕获版本内容。\
     * 断言：\
     *  - 版本内容等于词条 markdown 的预览值；\
     *  - versionId 同样被写回响应。\
     * 边界/异常：\
     *  - 若预览值为空说明策略回退失败。\
     */
    @Test
    void persistSyncFlow_FallbacksToPreviewWhenSerializationFails() {
        WordResponse response = new WordResponse();
        AtomicReference<String> versionContent = new AtomicReference<>();

        WordPersistenceCoordinator.PersistenceContext context = WordPersistenceCoordinator.builder()
            .userId(3L)
            .requestedTerm("input")
            .language(Language.ENGLISH)
            .flavor(DictionaryFlavor.BILINGUAL)
            .model("model")
            .recordId(4L)
            .captureHistory(true)
            .response(response)
            .personalizationContext(null)
            .saveWordStep((requested, resp, language, flavor) -> {
                Word word = new Word();
                word.setTerm("fallback");
                word.setMarkdown("markdown-content-with-length");
                return word;
            })
            .recordSynchronizationStep((userId, recordId, canonicalTerm) -> {})
            .versionPersistStep((recordId, userId, model, content, word, flavor) -> {
                versionContent.set(content);
                SearchResultVersion version = new SearchResultVersion();
                version.setId(21L);
                return version;
            })
            .personalizationStep((userId, resp, context1) -> resp)
            .wordSerializationStep(word -> {
                throw new JsonProcessingException("boom") {};
            })
            .sanitizedMarkdown(null)
            .build();

        WordVersionContentStrategy strategy = new ResponseMarkdownOrSerializedWordStrategy();
        WordPersistenceCoordinator.PersistenceOutcome outcome = coordinator.persist(context, strategy);

        String expectedPreview = SensitiveDataUtil.previewText("markdown-content-with-length");
        assertEquals(expectedPreview, versionContent.get(), "序列化失败时应回退到 markdown 预览");
        assertEquals(21L, outcome.response().getVersionId(), "versionId 仍需写回响应");
    }
}
