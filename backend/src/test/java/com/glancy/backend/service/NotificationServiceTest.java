package com.glancy.backend.service;
import org.junit.jupiter.api.Assertions;
import com.glancy.backend.dto.NotificationRequest;
import com.glancy.backend.dto.NotificationResponse;
import com.glancy.backend.entity.User;
import com.glancy.backend.repository.NotificationRepository;
import com.glancy.backend.repository.UserRepository;
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
class NotificationServiceTest {

    @Autowired
    private NotificationService notificationService;

    @Autowired
    private NotificationRepository notificationRepository;

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
        notificationRepository.deleteAll();
        userRepository.deleteAll();
    }

    /**
     * 测试 testCreateAndQueryNotifications 接口
     */
    @Test
    void testCreateAndQueryNotifications() {
        User user = new User();
        user.setUsername("u1");
        user.setPassword("pass");
        user.setEmail("u1@example.com");
        user.setPhone("11");
        userRepository.save(user);

        NotificationRequest req = new NotificationRequest();
        req.setMessage("sys msg");
        NotificationResponse sys = notificationService.createSystemNotification(req);
        Assertions.assertTrue(sys.getSystemLevel());

        NotificationRequest ureq = new NotificationRequest();
        ureq.setMessage("user msg");
        NotificationResponse uresp = notificationService.createUserNotification(user.getId(), ureq);
        Assertions.assertFalse(uresp.getSystemLevel());
        Assertions.assertEquals(user.getId(), uresp.getUserId());

        List<NotificationResponse> list = notificationService.getNotificationsForUser(user.getId());
        Assertions.assertEquals(2, list.size());
        Assertions.assertEquals("user msg", list.get(0).getMessage());
        Assertions.assertEquals("sys msg", list.get(1).getMessage());
    }
}
