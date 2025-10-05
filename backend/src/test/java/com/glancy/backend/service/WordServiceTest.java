package com.glancy.backend.service;

import static org.junit.jupiter.api.Assertions.*;

import com.glancy.backend.dto.WordResponse;
import com.glancy.backend.entity.DictionaryFlavor;
import com.glancy.backend.entity.Language;
import com.glancy.backend.entity.User;
import com.glancy.backend.entity.Word;
import com.glancy.backend.repository.SearchRecordRepository;
import com.glancy.backend.repository.SearchResultVersionRepository;
import com.glancy.backend.repository.UserPreferenceRepository;
import com.glancy.backend.repository.UserRepository;
import com.glancy.backend.repository.WordRepository;
import io.github.cdimascio.dotenv.Dotenv;
import java.time.LocalDateTime;
import java.util.List;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest
@Transactional
class WordServiceTest {

    @Autowired
    private WordService wordService;

    @Autowired
    private UserPreferenceRepository userPreferenceRepository;

    @Autowired
    private WordRepository wordRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private SearchRecordRepository searchRecordRepository;

    @Autowired
    private SearchResultVersionRepository searchResultVersionRepository;

    private Long userId;

    @BeforeAll
    static void loadEnv() {
        Dotenv dotenv = Dotenv.configure().ignoreIfMissing().load();
        String dbPassword = dotenv.get("DB_PASSWORD");
        if (dbPassword != null) {
            System.setProperty("DB_PASSWORD", dbPassword);
        }
    }

    @BeforeEach
    void setUp() {
        wordRepository.deleteAll();
        userPreferenceRepository.deleteAll();
        searchRecordRepository.deleteAll();
        searchResultVersionRepository.deleteAll();
        userRepository.deleteAll();
        User user = new User();
        user.setUsername("word-tester");
        user.setPassword("pwd");
        user.setEmail("word@test.com");
        user.setPhone("001");
        userRepository.save(user);
        user.setLastLoginAt(LocalDateTime.now());
        userRepository.save(user);
        userId = user.getId();
    }

    /**
     * 测试目标：验证首次查询会通过模型拉取词条并写入缓存。
     * 前置条件：
     *  - 测试用户已存在且词库中不存在目标词条。
     * 步骤：
     *  1) 调用 findWordForUser 搜索新词。
     * 断言：
     *  - 返回结果包含持久化 ID。
     *  - 数据库存在对应词条记录。
     * 边界/异常：
     *  - 覆盖 forceNew=false 的首次查询路径。
     */
    @Test
    void testFetchAndCacheWord() {
        WordResponse result = wordService.findWordForUser(
            userId,
            "hello",
            Language.ENGLISH,
            DictionaryFlavor.BILINGUAL,
            null,
            false
        );

        assertNotNull(result.getId());
        assertTrue(wordRepository.findById(Long.parseLong(result.getId())).isPresent());
    }

    /**
     * 测试目标：验证相同词条不同大小写查询时命中缓存。
     * 前置条件：
     *  - 数据库中已存在小写形式的缓存词条。
     * 步骤：
     *  1) 先持久化词条 "cached"。
     *  2) 使用大写 "CACHED" 调用 findWordForUser。
     * 断言：
     *  - 返回结果复用原有词条 ID。
     *  - Markdown 内容与缓存一致。
     * 边界/异常：
     *  - 覆盖大小写差异导致的归一化命中场景。
     */
    @Test
    void testUseCachedWord() {
        Word word = new Word();
        word.setTerm("cached");
        word.setNormalizedTerm("cached");
        word.setLanguage(Language.ENGLISH);
        word.setFlavor(DictionaryFlavor.BILINGUAL);
        word.setDefinitions(List.of("store"));
        word.setMarkdown("md");
        wordRepository.save(word);

        WordResponse result = wordService.findWordForUser(
            userId,
            "CACHED",
            Language.ENGLISH,
            DictionaryFlavor.BILINGUAL,
            null,
            false
        );

        assertEquals(String.valueOf(word.getId()), result.getId());
        assertEquals("md", result.getMarkdown());
    }

    /**
     * 测试目标：验证包含首尾空白的查询仍可命中缓存。
     * 前置条件：
     *  - 数据库已有词条 "cached"。
     * 步骤：
     *  1) 使用带空格的词条调用 findWordForUser。
     * 断言：
     *  - 返回结果沿用原有词条 ID。
     * 边界/异常：
     *  - 覆盖空白字符归一化场景。
     */
    @Test
    void testUseCachedWordWithWhitespace() {
        Word word = new Word();
        word.setTerm("cached");
        word.setNormalizedTerm("cached");
        word.setLanguage(Language.ENGLISH);
        word.setFlavor(DictionaryFlavor.BILINGUAL);
        word.setDefinitions(List.of("store"));
        word.setMarkdown("md");
        wordRepository.save(word);

        WordResponse result = wordService.findWordForUser(
            userId,
            "  cached  ",
            Language.ENGLISH,
            DictionaryFlavor.BILINGUAL,
            null,
            false
        );

        assertEquals(String.valueOf(word.getId()), result.getId());
    }

    /**
     * 测试目标：验证当模型未返回语言时仍以请求语言入库并可命中缓存。
     * 前置条件：
     *  - 环境中无同名词条缓存。
     * 步骤：
     *  1) 调用 findWordForUser 查询新词。
     * 断言：
     *  - 返回结果语言为请求语言。
     *  - 归一化查询可命中数据库记录。
     * 边界/异常：
     *  - 覆盖模型回包缺失语言字段场景。
     */
    @Test
    void testCacheWordWhenLanguageMissing() {
        WordResponse result = wordService.findWordForUser(
            userId,
            "bye",
            Language.ENGLISH,
            DictionaryFlavor.BILINGUAL,
            null,
            false
        );

        assertEquals(Language.ENGLISH, result.getLanguage());
        assertTrue(
            wordRepository.findActiveByNormalizedTerm("bye", Language.ENGLISH, DictionaryFlavor.BILINGUAL).isPresent()
        );
    }

    /**
     * 测试目标：验证相同词条在不同语言下可独立缓存。
     * 前置条件：
     *  - 数据库为空。
     * 步骤：
     *  1) 分别保存英文与中文词条。
     * 断言：
     *  - 不同语言的词条可同时存在并被归一化命中。
     * 边界/异常：
     *  - 覆盖多语言并存场景。
     */
    @Test
    void testSaveSameTermDifferentLanguage() {
        Word wordEn = new Word();
        wordEn.setTerm("hello");
        wordEn.setNormalizedTerm("hello");
        wordEn.setLanguage(Language.ENGLISH);
        wordEn.setFlavor(DictionaryFlavor.BILINGUAL);
        wordEn.setDefinitions(List.of("greet"));
        wordRepository.save(wordEn);

        Word wordZh = new Word();
        wordZh.setTerm("hello");
        wordZh.setNormalizedTerm("hello");
        wordZh.setLanguage(Language.CHINESE);
        wordZh.setFlavor(DictionaryFlavor.BILINGUAL);
        wordZh.setDefinitions(List.of("\u4f60\u597d"));

        assertDoesNotThrow(() -> wordRepository.save(wordZh));

        assertTrue(
            wordRepository.findActiveByNormalizedTerm("hello", Language.ENGLISH, DictionaryFlavor.BILINGUAL).isPresent()
        );
        assertTrue(
            wordRepository.findActiveByNormalizedTerm("hello", Language.CHINESE, DictionaryFlavor.BILINGUAL).isPresent()
        );
    }

    /**
     * 测试目标：验证带标点的查询可复用缓存。\
     * 前置条件：
     *  - 词库已有 normalizedTerm="hello" 的词条。
     * 步骤：
     *  1) 以带多重感叹号的词条发起查询。
     * 断言：
     *  - 命中缓存并返回相同的 Markdown。
     * 边界/异常：
     *  - 覆盖标点归一化场景。
     */
    @Test
    void testUseCachedWordWithPunctuation() {
        Word word = new Word();
        word.setTerm("hello");
        word.setNormalizedTerm("hello");
        word.setLanguage(Language.ENGLISH);
        word.setFlavor(DictionaryFlavor.BILINGUAL);
        word.setDefinitions(List.of("greeting"));
        word.setMarkdown("hello-md");
        wordRepository.save(word);

        WordResponse result = wordService.findWordForUser(
            userId,
            "hello!!!",
            Language.ENGLISH,
            DictionaryFlavor.BILINGUAL,
            null,
            false
        );

        assertEquals(String.valueOf(word.getId()), result.getId());
        assertEquals("hello-md", result.getMarkdown());
    }
}
