package com.glancy.backend.repository;

import static org.junit.jupiter.api.Assertions.*;

import com.glancy.backend.entity.MembershipTier;
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
        assertTrue(found.isPresent());
        assertEquals("user1@example.com", found.get().getEmail());
    }

    @Test
    void countAndLoginTokenQueries() {
        User active = TestEntityFactory.user(2);
        LocalDateTime reference = LocalDateTime.now();
        active.setMembershipTier(MembershipTier.PLUS);
        active.setMembershipExpiresAt(reference.plusDays(1));
        active.setLoginToken("token123");
        User deleted = TestEntityFactory.user(3);
        deleted.setDeleted(true);
        userRepository.save(active);
        userRepository.save(deleted);

        assertEquals(1, userRepository.countByDeletedFalse());
        assertEquals(1, userRepository.countByDeletedTrue());
        assertEquals(
            1,
            userRepository.countByDeletedFalseAndMembershipTierIsNotNullAndMembershipExpiresAtGreaterThanEqual(
                reference
            )
        );
        assertTrue(userRepository.findByLoginToken("token123").isPresent());
    }
}
