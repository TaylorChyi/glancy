package com.glancy.backend.service;

import static org.junit.jupiter.api.Assertions.*;

import com.glancy.backend.dto.WordResponse;
import com.glancy.backend.entity.Language;
import com.glancy.backend.entity.Word;
import com.glancy.backend.repository.UserPreferenceRepository;
import com.glancy.backend.repository.WordRepository;
import io.github.cdimascio.dotenv.Dotenv;
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
    }

    /**
     * 测试 testFetchAndCacheWord 接口
     */
    @Test
    void testFetchAndCacheWord() {
        WordResponse result = wordService.findWordForUser(1L, "hello", Language.ENGLISH, null);

        assertNotNull(result.getId());
        assertTrue(wordRepository.findById(Long.parseLong(result.getId())).isPresent());
    }

    /**
     * 测试 testUseCachedWord 接口
     */
    @Test
    void testUseCachedWord() {
        Word word = new Word();
        word.setTerm("cached");
        word.setLanguage(Language.ENGLISH);
        word.setDefinitions(List.of("store"));
        wordRepository.save(word);

        WordResponse result = wordService.findWordForUser(1L, "cached", Language.ENGLISH, null);

        assertEquals(String.valueOf(word.getId()), result.getId());
    }

    /**
     * 测试 testGetAudio 接口
     */
    @Test
    void testGetAudio() {
        byte[] result = wordService.getAudio("hello", Language.ENGLISH);
        assertNotNull(result);
    }

    /**
     * 测试 testCacheWordWhenLanguageMissing 接口
     */
    @Test
    void testCacheWordWhenLanguageMissing() {
        WordResponse result = wordService.findWordForUser(1L, "bye", Language.ENGLISH, null);

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
}
