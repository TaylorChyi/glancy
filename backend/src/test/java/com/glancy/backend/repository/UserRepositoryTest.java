package com.glancy.backend.repository;
import org.junit.jupiter.api.Assertions;
import com.glancy.backend.entity.MembershipType;
import com.glancy.backend.entity.User;
import java.time.LocalDateTime;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;

@DataJpaTest
class UserRepositoryTest {

    @Autowired
    private UserRepository userRepository;

    @Test
    void findByUsernameAndDeletedFalse() {
        User user = TestEntityFactory.user(1);
        userRepository.save(user);

        Optional<User> found = userRepository.findByUsernameAndDeletedFalse("user1");
        Assertions.assertTrue(found.isPresent());
        Assertions.assertEquals("user1@example.com", found.get().getEmail());
    }

    @Test
    void countAndLoginTokenQueries() {
        User active = TestEntityFactory.user(2);
        LocalDateTime now = LocalDateTime.now();
        active.updateMembership(MembershipType.PLUS, now.plusDays(1), now);
        active.setLoginToken("token123");
        User deleted = TestEntityFactory.user(3);
        deleted.setDeleted(true);
        userRepository.save(active);
        userRepository.save(deleted);

        Assertions.assertEquals(1, userRepository.countByDeletedFalse());
        Assertions.assertEquals(1, userRepository.countByDeletedTrue());
        Assertions.assertEquals(1, userRepository.countActiveMembers(LocalDateTime.now()));
        Assertions.assertTrue(userRepository.findByLoginToken("token123").isPresent());
    }
}
