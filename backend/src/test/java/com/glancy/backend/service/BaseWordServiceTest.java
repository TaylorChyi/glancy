package com.glancy.backend.service;

import com.glancy.backend.entity.DictionaryFlavor;
import com.glancy.backend.entity.Language;
import com.glancy.backend.entity.User;
import com.glancy.backend.repository.SearchRecordRepository;
import com.glancy.backend.repository.SearchResultVersionRepository;
import com.glancy.backend.repository.UserPreferenceRepository;
import com.glancy.backend.repository.UserRepository;
import com.glancy.backend.repository.WordRepository;
import com.glancy.backend.service.word.WordSearchOptions;
import io.github.cdimascio.dotenv.Dotenv;
import java.time.LocalDateTime;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.BeforeEach;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest
@Transactional
abstract class BaseWordServiceTest {

    @Autowired
    protected WordService wordService;

    @Autowired
    protected UserPreferenceRepository userPreferenceRepository;

    @Autowired
    protected WordRepository wordRepository;

    @Autowired
    protected UserRepository userRepository;

    @Autowired
    protected SearchRecordRepository searchRecordRepository;

    @Autowired
    protected SearchResultVersionRepository searchResultVersionRepository;

    protected Long userId;

    @BeforeAll
    static void loadEnv() {
        Dotenv dotenv = Dotenv.configure().ignoreIfMissing().load();
        String dbPassword = dotenv.get("DB_PASSWORD");
        if (dbPassword != null) {
            System.setProperty("DB_PASSWORD", dbPassword);
        }
    }

    @BeforeEach
    void resetData() {
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

    protected WordSearchOptions options(
            String term,
            Language language,
            DictionaryFlavor flavor,
            String model,
            boolean forceNew,
            boolean captureHistory) {
        return WordSearchOptions.of(term, language, flavor, model, forceNew, captureHistory);
    }
}
