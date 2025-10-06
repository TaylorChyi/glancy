package com.glancy.backend.service;

import static org.junit.jupiter.api.Assertions.*;

import com.glancy.backend.dto.UserStatisticsResponse;
import com.glancy.backend.entity.MembershipType;
import com.glancy.backend.entity.User;
import com.glancy.backend.repository.UserRepository;
import io.github.cdimascio.dotenv.Dotenv;
import java.time.LocalDateTime;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest
@Transactional
class UserStatisticsServiceTest {

    @Autowired
    private UserService userService;

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
        userRepository.deleteAll();
    }

    /**
     * 测试 testStatistics 接口
     */
    @Test
    void testStatistics() {
        User u1 = new User();
        u1.setUsername("u1");
        u1.setPassword("p");
        u1.setEmail("u1@example.com");
        u1.setPhone("31");
        LocalDateTime now = LocalDateTime.now();
        u1.updateMembership(MembershipType.PLUS, now.plusDays(30), now);
        userRepository.save(u1);

        User u2 = new User();
        u2.setUsername("u2");
        u2.setPassword("p");
        u2.setEmail("u2@example.com");
        u2.setPhone("32");
        userRepository.save(u2);

        User u3 = new User();
        u3.setUsername("u3");
        u3.setPassword("p");
        u3.setEmail("u3@example.com");
        u3.setPhone("33");
        u3.setDeleted(true);
        userRepository.save(u3);

        UserStatisticsResponse stats = userService.getStatistics();
        assertEquals(3, stats.getTotalUsers());
        assertEquals(1, stats.getMemberUsers());
        assertEquals(1, stats.getDeletedUsers());
    }
}
