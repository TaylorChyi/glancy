package com.glancy.backend.service;

import static org.junit.jupiter.api.Assertions.*;

import com.glancy.backend.dto.UserPreferenceRequest;
import com.glancy.backend.dto.UserPreferenceResponse;
import com.glancy.backend.entity.DictionaryModel;
import com.glancy.backend.entity.User;
import com.glancy.backend.repository.UserPreferenceRepository;
import com.glancy.backend.repository.UserRepository;
import io.github.cdimascio.dotenv.Dotenv;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest
@Transactional
class UserPreferenceServiceTest {

    @Autowired
    private UserPreferenceService userPreferenceService;

    @Autowired
    private UserPreferenceRepository userPreferenceRepository;

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
        userPreferenceRepository.deleteAll();
        userRepository.deleteAll();
    }

    /**
     * 测试 testSaveAndGetPreference 接口
     */
    @Test
    void testSaveAndGetPreference() {
        User user = new User();
        user.setUsername("prefuser");
        user.setPassword("pass");
        user.setEmail("pref@example.com");
        user.setPhone("22");
        userRepository.save(user);

        UserPreferenceRequest req = new UserPreferenceRequest();
        req.setTheme("light");
        req.setSystemLanguage("en");
        req.setSearchLanguage("zh");
        req.setDictionaryModel(DictionaryModel.DEEPSEEK);
        UserPreferenceResponse saved = userPreferenceService.savePreference(user.getId(), req);

        assertNotNull(saved.getId());
        assertEquals("light", saved.getTheme());

        UserPreferenceResponse fetched = userPreferenceService.getPreference(user.getId());
        assertEquals(saved.getId(), fetched.getId());
        assertEquals("zh", fetched.getSearchLanguage());
        assertEquals(DictionaryModel.DEEPSEEK, fetched.getDictionaryModel());
    }

    /**
     * 测试 testDefaultPreferenceWhenMissing 接口
     */
    @Test
    void testDefaultPreferenceWhenMissing() {
        User user = new User();
        user.setUsername("prefuser2");
        user.setPassword("pass");
        user.setEmail("pref2@example.com");
        user.setPhone("33");
        userRepository.save(user);

        UserPreferenceResponse fetched = userPreferenceService.getPreference(user.getId());
        assertEquals("light", fetched.getTheme());
        assertEquals("en", fetched.getSystemLanguage());
        assertEquals(DictionaryModel.DEEPSEEK, fetched.getDictionaryModel());
    }
}
