package com.glancy.backend.service.word;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.glancy.backend.dto.WordResponse;
import com.glancy.backend.entity.DictionaryFlavor;
import com.glancy.backend.entity.Language;
import com.glancy.backend.entity.Word;
import com.glancy.backend.repository.WordRepository;
import com.glancy.backend.service.support.DictionaryTermNormalizer;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

/**
 * 背景：
 *  - 词条缓存更新时需要同步不可变列表，避免 Hibernate 关联集合引用被替换导致的异常。
 * 目的：
 *  - 验证 WordCacheManager 在不同来源列表场景下能保持集合可变性并正确同步数据。
 * 关键决策与取舍：
 *  - 通过 replaceContents 模板方法原地替换集合内容，避免对实体字段重新赋值。
 * 影响范围：
 *  - WordCacheManager 保存逻辑及其涉及的集合字段。
 * 演进与TODO：
 *  - 若未来引入增量更新策略，可在此类基础上扩展差分合并逻辑。
 */
class WordCacheManagerTest {

    private WordRepository wordRepository;
    private DictionaryTermNormalizer termNormalizer;
    private WordCacheManager cacheManager;

    @BeforeEach
    void setUp() {
        wordRepository = mock(WordRepository.class);
        termNormalizer = mock(DictionaryTermNormalizer.class);
        when(termNormalizer.normalize(anyString())).thenAnswer(invocation -> invocation.getArgument(0));
        cacheManager = new WordCacheManager(wordRepository, termNormalizer, new ObjectMapper());
    }

    /**
     * 测试目标：验证当响应返回 List.of 创建的不可变集合时，保存流程不会抛出 UnsupportedOperationException。
     * 前置条件：
     *  - 已存在词条实体且集合字段为 Hibernate 管理的 ArrayList。
     * 步骤：
     *  1) 使用包含不可变集合的 WordResponse 调用 saveWord。
     * 断言：
     *  - 保存过程中不抛出异常；
     *  - 持久化实体集合内容被正确替换且仍可变。
     * 边界/异常：
     *  - 如果集合被替换为不可变实现，则后续 add 操作将失败。
     */
    @Test
    void saveWord_ReplacesWithImmutableSourceWithoutException() {
        Word existing = new Word();
        existing.setId(1L);
        existing.setTerm("alpha");
        existing.setNormalizedTerm("alpha");
        existing.setLanguage(Language.ENGLISH);
        existing.setFlavor(DictionaryFlavor.BILINGUAL);
        existing.getDefinitions().add("legacy");
        when(wordRepository.findActiveByNormalizedTerm(anyString(), any(), any()))
            .thenReturn(Optional.of(existing));
        when(wordRepository.save(any(Word.class))).thenAnswer(invocation -> invocation.getArgument(0));

        WordResponse response = new WordResponse();
        response.setTerm("alpha");
        response.setDefinitions(List.of("fresh"));
        response.setVariations(List.of("alphae"));
        response.setSynonyms(List.of("begin"));
        response.setAntonyms(List.of("end"));
        response.setRelated(List.of("start"));
        response.setPhrases(List.of("alpha test"));

        assertDoesNotThrow(() -> cacheManager.saveWord("alpha", response, Language.ENGLISH, DictionaryFlavor.BILINGUAL));
        assertEquals(List.of("fresh"), existing.getDefinitions(), "Definitions should be replaced using mutable list");
        assertDoesNotThrow(() -> existing.getDefinitions().add("another"), "Definitions list must remain mutable");
    }

    /**
     * 测试目标：验证当响应集合为 null 时，持久化实体集合会被清空且保持原引用。
     * 前置条件：
     *  - 已存在词条实体，其 definitions 初始化并包含历史数据。
     * 步骤：
     *  1) 构造 definitions 等字段为 null 的 WordResponse 调用 saveWord。
     * 断言：
     *  - 实体集合被清空；
     *  - 集合引用未发生变化，确保 Hibernate 依旧跟踪。
     * 边界/异常：
     *  - 若集合被替换，新旧引用将不相等。
     */
    @Test
    void saveWord_ClearsCollectionWhenSourceIsNull() {
        Word existing = new Word();
        existing.setId(2L);
        existing.setTerm("beta");
        existing.setNormalizedTerm("beta");
        existing.setLanguage(Language.ENGLISH);
        existing.setFlavor(DictionaryFlavor.BILINGUAL);
        existing.getDefinitions().addAll(Arrays.asList("one", "two"));
        List<String> originalDefinitions = existing.getDefinitions();
        when(wordRepository.findActiveByNormalizedTerm(anyString(), any(), any()))
            .thenReturn(Optional.of(existing));
        when(wordRepository.save(any(Word.class))).thenAnswer(invocation -> invocation.getArgument(0));

        WordResponse response = new WordResponse();
        response.setTerm("beta");
        response.setDefinitions(null);
        response.setVariations(null);
        response.setSynonyms(null);
        response.setAntonyms(null);
        response.setRelated(null);
        response.setPhrases(null);

        cacheManager.saveWord("beta", response, Language.ENGLISH, DictionaryFlavor.BILINGUAL);

        assertSame(originalDefinitions, existing.getDefinitions(), "Collection reference must remain identical");
        assertTrue(existing.getDefinitions().isEmpty(), "Definitions should be cleared when source is null");
    }

    /**
     * 测试目标：验证新建词条时可将可变集合内容完整复制到实体。
     * 前置条件：
     *  - 缓存中不存在对应归一化词条。
     * 步骤：
     *  1) 使用包含可变 ArrayList 的 WordResponse 调用 saveWord；
     *  2) 捕获返回实体集合内容。
     * 断言：
     *  - 保存不抛出异常；
     *  - 集合内容与源列表一致。
     * 边界/异常：
     *  - 覆盖新增词条路径，确保 replaceContents 同样适用。
     */
    @Test
    void saveWord_PopulatesCollectionsForNewEntity() {
        when(wordRepository.findActiveByNormalizedTerm(anyString(), any(), any())).thenReturn(Optional.empty());
        when(wordRepository.save(any(Word.class))).thenAnswer(invocation -> {
            Word saved = invocation.getArgument(0);
            saved.setId(99L);
            return saved;
        });

        WordResponse response = new WordResponse();
        response.setTerm("gamma");
        response.setDefinitions(Arrays.asList("meaning"));
        response.setVariations(Arrays.asList("gammas"));
        response.setSynonyms(Arrays.asList("ray"));
        response.setAntonyms(Arrays.asList("none"));
        response.setRelated(Arrays.asList("radiation"));
        response.setPhrases(Arrays.asList("gamma ray"));

        Word saved = assertDoesNotThrow(
            () -> cacheManager.saveWord("gamma", response, Language.ENGLISH, DictionaryFlavor.BILINGUAL)
        );

        assertEquals(List.of("meaning"), saved.getDefinitions(), "Definitions should match response values");
        assertEquals(List.of("gamma ray"), saved.getPhrases(), "Phrases should match response values");
    }
}
