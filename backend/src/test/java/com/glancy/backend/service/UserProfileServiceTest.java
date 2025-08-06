package com.glancy.backend.service;

import static org.junit.jupiter.api.Assertions.*;

import com.glancy.backend.dto.UserProfileRequest;
import com.glancy.backend.dto.UserProfileResponse;
import com.glancy.backend.entity.User;
import com.glancy.backend.repository.UserProfileRepository;
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
class UserProfileServiceTest {

    @Autowired
    private UserProfileService userProfileService;

    @Autowired
    private UserProfileRepository userProfileRepository;

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
        userProfileRepository.deleteAll();
        userRepository.deleteAll();
    }

    /**
     * 测试 testSaveAndGetProfile 接口
     */
    @Test
    void testSaveAndGetProfile() {
        User user = new User();
        user.setUsername("profileuser");
        user.setPassword("pass");
        user.setEmail("profile@example.com");
        user.setPhone("111");
        userRepository.save(user);

        UserProfileRequest req = new UserProfileRequest();
        req.setAge(20);
        req.setGender("M");
        req.setJob("dev");
        req.setInterest("code");
        req.setGoal("learn");
        UserProfileResponse saved = userProfileService.saveProfile(user.getId(), req);

        assertNotNull(saved.getId());
        assertEquals(20, saved.getAge());

        UserProfileResponse fetched = userProfileService.getProfile(user.getId());
        assertEquals(saved.getId(), fetched.getId());
        assertEquals("dev", fetched.getJob());
    }

    /**
     * Return default profile when none exists.
     */
    @Test
    void testDefaultProfileWhenMissing() {
        User user = new User();
        user.setUsername("p2");
        user.setPassword("pass");
        user.setEmail("p2@example.com");
        user.setPhone("112");
        userRepository.save(user);

        UserProfileResponse fetched = userProfileService.getProfile(user.getId());
        assertNull(fetched.getId());
        assertNull(fetched.getAge());
        assertEquals(user.getId(), fetched.getUserId());
    }
}
