package com.glancy.backend.service;

import com.glancy.backend.dto.UserRegistrationRequest;
import com.glancy.backend.dto.UserResponse;
import com.glancy.backend.entity.MembershipType;
import com.glancy.backend.entity.User;
import java.time.LocalDateTime;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

class UserServiceMembershipTest extends AbstractUserServiceTest {

  @Test
  void testCountActiveUsers() {
    User u1 = new User();
    u1.setUsername("a1");
    u1.setPassword("p");
    u1.setEmail("a1@example.com");
    u1.setPhone("201");
    userRepository.save(u1);

    User u2 = new User();
    u2.setUsername("a2");
    u2.setPassword("p");
    u2.setEmail("a2@example.com");
    u2.setPhone("202");
    u2.setDeleted(true);
    userRepository.save(u2);

    long count = userService.countActiveUsers();
    Assertions.assertEquals(1, count);
  }

  @Test
  void testMembershipOps() {
    UserRegistrationRequest req = new UserRegistrationRequest();
    req.setUsername("member");
    req.setPassword("p");
    req.setEmail("m@example.com");
    req.setPhone("203");
    UserResponse resp = userService.register(req);

    LocalDateTime expiresAt = LocalDateTime.now().plusDays(7);
    userService.activateMembership(resp.getId(), MembershipType.PRO, expiresAt);
    User user = userRepository.findById(resp.getId()).orElseThrow();
    Assertions.assertEquals(MembershipType.PRO, user.getMembershipType());
    Assertions.assertEquals(expiresAt, user.getMembershipExpiresAt());
    Assertions.assertTrue(user.hasActiveMembershipAt(LocalDateTime.now()));

    userService.removeMembership(resp.getId());
    User user2 = userRepository.findById(resp.getId()).orElseThrow();
    Assertions.assertEquals(MembershipType.NONE, user2.getMembershipType());
    Assertions.assertNull(user2.getMembershipExpiresAt());
    Assertions.assertFalse(user2.hasActiveMembershipAt(LocalDateTime.now()));
  }
}
