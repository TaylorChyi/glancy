package com.glancy.backend.service;

import static org.junit.jupiter.api.Assertions.*;

import com.glancy.backend.dto.SearchRecordRequest;
import com.glancy.backend.dto.SearchRecordResponse;
import com.glancy.backend.dto.WordResponse;
import com.glancy.backend.entity.Language;
import com.glancy.backend.entity.User;
import com.glancy.backend.entity.Word;
import com.glancy.backend.repository.UserPreferenceRepository;
import com.glancy.backend.repository.UserRepository;
import com.glancy.backend.repository.WordRepository;
import io.github.cdimascio.dotenv.Dotenv;
import java.util.List;
import java.time.LocalDateTime;
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
    private SearchRecordService searchRecordService;

    @Autowired
    private UserRepository userRepository;

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
        userRepository.deleteAll();
    }

    /**
     * 测试 testFetchAndCacheWord 接口
     */
    @Test
    void testFetchAndCacheWord() {
        Long userId = prepareUser();
        Long recordId = createRecord(userId, "hello", Language.ENGLISH).id();
        WordResponse result = wordService.findWordForUser(userId, recordId, "hello", Language.ENGLISH, null, false);

        assertNotNull(result.getId());
        assertNotNull(result.getVersionId());
        assertTrue(wordRepository.findById(Long.parseLong(result.getId())).isPresent());
    }

    /**
     * 测试 testUseCachedWord 接口
     */
    @Test
    void testUseCachedWord() {
        Long userId = prepareUser();
        Word word = new Word();
        word.setTerm("cached");
        word.setLanguage(Language.ENGLISH);
        word.setDefinitions(List.of("store"));
        word.setMarkdown("md");
        wordRepository.save(word);

        Long recordId = createRecord(userId, "cached", Language.ENGLISH).id();

        WordResponse result = wordService.findWordForUser(userId, recordId, "cached", Language.ENGLISH, null, false);

        assertEquals(String.valueOf(word.getId()), result.getId());
        assertEquals("md", result.getMarkdown());
    }

    /**
     * 测试 testCacheWordWhenLanguageMissing 接口
     */
    @Test
    void testCacheWordWhenLanguageMissing() {
        Long userId = prepareUser();
        Long recordId = createRecord(userId, "bye", Language.ENGLISH).id();
        WordResponse result = wordService.findWordForUser(userId, recordId, "bye", Language.ENGLISH, null, false);

        assertEquals(Language.ENGLISH, result.getLanguage());
        assertTrue(wordRepository.findByTermAndLanguageAndDeletedFalse("bye", Language.ENGLISH).isPresent());
    }

    /**
     * 测试 testSaveSameTermDifferentLanguage 接口
     */
    @Test
    void testSaveSameTermDifferentLanguage() {
        Word wordEn = new Word();
        wordEn.setTerm("hello");
        wordEn.setLanguage(Language.ENGLISH);
        wordEn.setDefinitions(List.of("greet"));
        wordRepository.save(wordEn);

        Word wordZh = new Word();
        wordZh.setTerm("hello");
        wordZh.setLanguage(Language.CHINESE);
        wordZh.setDefinitions(List.of("\u4f60\u597d"));

        assertDoesNotThrow(() -> wordRepository.save(wordZh));

        assertTrue(wordRepository.findByTermAndLanguageAndDeletedFalse("hello", Language.ENGLISH).isPresent());
        assertTrue(wordRepository.findByTermAndLanguageAndDeletedFalse("hello", Language.CHINESE).isPresent());
    }

    private Long prepareUser() {
        User user = new User();
        user.setUsername("word-service-user");
        user.setPassword("pwd");
        user.setEmail("word@example.com");
        user.setPhone("000");
        userRepository.save(user);
        user.setLastLoginAt(LocalDateTime.now());
        return userRepository.save(user).getId();
    }

    private SearchRecordResponse createRecord(Long userId, String term, Language language) {
        SearchRecordRequest request = new SearchRecordRequest();
        request.setTerm(term);
        request.setLanguage(language);
        return searchRecordService.saveRecord(userId, request);
    }
}
