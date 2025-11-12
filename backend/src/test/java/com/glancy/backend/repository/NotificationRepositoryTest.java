package com.glancy.backend.repository;

import com.glancy.backend.entity.Notification;
import com.glancy.backend.entity.User;
import java.time.LocalDateTime;
import java.util.List;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;

@DataJpaTest
class NotificationRepositoryTest {

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private UserRepository userRepository;

    @Test
    void notificationQueries() {
        User user = userRepository.save(TestEntityFactory.user(20));
        Notification system = TestEntityFactory.notification(null, "sys", true, LocalDateTime.now().minusHours(1));
        Notification userNote = TestEntityFactory.notification(user, "user", false, LocalDateTime.now());
        notificationRepository.save(system);
        notificationRepository.save(userNote);

        List<Notification> systemList = notificationRepository.findBySystemLevelTrue();
        Assertions.assertEquals(1, systemList.size());

        List<Notification> userList = notificationRepository.findByUserId(user.getId());
        Assertions.assertEquals(1, userList.size());

        List<Notification> sortedUser = notificationRepository.findByUserIdOrderByCreatedAtDesc(user.getId());
        Assertions.assertEquals("user", sortedUser.get(0).getMessage());

        List<Notification> sortedSystem = notificationRepository.findBySystemLevelTrueOrderByCreatedAtDesc();
        Assertions.assertEquals("sys", sortedSystem.get(0).getMessage());
    }
}
