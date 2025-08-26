package com.glancy.backend.repository;

import static org.junit.jupiter.api.Assertions.*;

import com.glancy.backend.entity.User;
import com.glancy.backend.entity.UserPreference;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;

@DataJpaTest
class UserPreferenceRepositoryTest {

  @Autowired private UserPreferenceRepository userPreferenceRepository;

  @Autowired private UserRepository userRepository;

  @Test
  void findByUserId() {
    User user = userRepository.save(TestEntityFactory.user(40));
    UserPreference pref = TestEntityFactory.userPreference(user);
    userPreferenceRepository.save(pref);

    Optional<UserPreference> found = userPreferenceRepository.findByUserId(user.getId());
    assertTrue(found.isPresent());
    assertEquals("light", found.get().getTheme());
  }
}
