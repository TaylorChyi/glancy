package com.glancy.backend.service;
import org.junit.jupiter.api.Assertions;
import com.glancy.backend.dto.UserPreferenceRequest;
import com.glancy.backend.dto.UserPreferenceResponse;
import com.glancy.backend.dto.UserPreferenceUpdateRequest;
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
        UserPreferenceResponse saved = userPreferenceService.savePreference(user.getId(), req);

        Assertions.assertNotNull(saved.getId());
        Assertions.assertEquals("light", saved.getTheme());

        UserPreferenceResponse fetched = userPreferenceService.getPreference(user.getId());
        Assertions.assertEquals(saved.getId(), fetched.getId());
        Assertions.assertEquals("zh", fetched.getSearchLanguage());
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
        Assertions.assertEquals("light", fetched.getTheme());
        Assertions.assertEquals("en", fetched.getSystemLanguage());
    }

    /**
     * 测试 updatePreference 仅更新主题时的处理逻辑
     */
    @Test
    void testUpdatePreferenceThemeOnly() {
        User user = new User();
        user.setUsername("prefuser3");
        user.setPassword("pass");
        user.setEmail("pref3@example.com");
        user.setPhone("44");
        userRepository.save(user);

        UserPreferenceRequest req = new UserPreferenceRequest();
        req.setTheme("light");
        req.setSystemLanguage("en");
        req.setSearchLanguage("en");
        userPreferenceService.savePreference(user.getId(), req);

        UserPreferenceUpdateRequest updateRequest = new UserPreferenceUpdateRequest();
        updateRequest.setTheme("dark");

        UserPreferenceResponse updated = userPreferenceService.updatePreference(user.getId(), updateRequest);

        Assertions.assertEquals("dark", updated.getTheme());
        Assertions.assertEquals("en", updated.getSystemLanguage());
        Assertions.assertEquals("en", updated.getSearchLanguage());
    }

    /**
     * 测试 updatePreference 同时更新多个字段时的处理逻辑
     */
    @Test
    void testUpdatePreferenceMultipleFields() {
        User user = new User();
        user.setUsername("prefuser4");
        user.setPassword("pass");
        user.setEmail("pref4@example.com");
        user.setPhone("55");
        userRepository.save(user);

        UserPreferenceRequest req = new UserPreferenceRequest();
        req.setTheme("light");
        req.setSystemLanguage("en");
        req.setSearchLanguage("en");
        userPreferenceService.savePreference(user.getId(), req);

        UserPreferenceUpdateRequest updateRequest = new UserPreferenceUpdateRequest();
        updateRequest.setTheme("dark");
        updateRequest.setSystemLanguage("fr");
        updateRequest.setSearchLanguage("es");

        UserPreferenceResponse updated = userPreferenceService.updatePreference(user.getId(), updateRequest);

        Assertions.assertEquals("dark", updated.getTheme());
        Assertions.assertEquals("fr", updated.getSystemLanguage());
        Assertions.assertEquals("es", updated.getSearchLanguage());
    }
}
