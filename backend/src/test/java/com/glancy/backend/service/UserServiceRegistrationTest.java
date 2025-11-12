package com.glancy.backend.service;

import com.glancy.backend.dto.UserRegistrationRequest;
import com.glancy.backend.dto.UserResponse;
import com.glancy.backend.entity.MembershipType;
import com.glancy.backend.entity.User;
import com.glancy.backend.exception.DuplicateResourceException;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

class UserServiceRegistrationTest extends AbstractUserServiceTest {

    @Test
    void testRegisterAndDeleteUser() {
        UserRegistrationRequest req = new UserRegistrationRequest();
        req.setUsername("testuser");
        req.setPassword("pass123");
        req.setEmail("test@example.com");
        req.setPhone("100");
        UserResponse resp = userService.register(req);

        Assertions.assertNotNull(resp.getId());
        Assertions.assertEquals("testuser", resp.getUsername());
        Assertions.assertFalse(resp.getMember());
        Assertions.assertEquals(MembershipType.NONE, resp.getMembershipType());
        Assertions.assertNull(resp.getMembershipExpiresAt());

        User user = userRepository.findById(resp.getId()).orElseThrow();
        Assertions.assertFalse(user.getDeleted());

        userService.deleteUser(resp.getId());
        User deletedUser = userRepository.findById(resp.getId()).orElseThrow();
        Assertions.assertTrue(deletedUser.getDeleted());
    }

    @Test
    void testRegisterDuplicateUsername() {
        UserRegistrationRequest req1 = new UserRegistrationRequest();
        req1.setUsername("user1");
        req1.setPassword("pass123");
        req1.setEmail("a@example.com");
        req1.setPhone("101");
        userService.register(req1);

        UserRegistrationRequest req2 = new UserRegistrationRequest();
        req2.setUsername("user1");
        req2.setPassword("pass456");
        req2.setEmail("b@example.com");
        req2.setPhone("102");

        DuplicateResourceException ex = Assertions.assertThrows(DuplicateResourceException.class, () ->
            userService.register(req2)
        );
        Assertions.assertEquals("用户名已存在", ex.getMessage());
    }

    @Test
    void testRegisterDuplicateEmail() {
        UserRegistrationRequest req1 = new UserRegistrationRequest();
        req1.setUsername("user1");
        req1.setPassword("pass123");
        req1.setEmail("a@example.com");
        req1.setPhone("111");
        userService.register(req1);

        UserRegistrationRequest req2 = new UserRegistrationRequest();
        req2.setUsername("user2");
        req2.setPassword("pass456");
        req2.setEmail("a@example.com");
        req2.setPhone("112");

        DuplicateResourceException ex = Assertions.assertThrows(DuplicateResourceException.class, () ->
            userService.register(req2)
        );
        Assertions.assertEquals("邮箱已被使用", ex.getMessage());
    }

    @Test
    void testRegisterDuplicatePhone() {
        UserRegistrationRequest req1 = new UserRegistrationRequest();
        req1.setUsername("userp1");
        req1.setPassword("pass123");
        req1.setEmail("p1@example.com");
        req1.setPhone("12345");
        userService.register(req1);

        UserRegistrationRequest req2 = new UserRegistrationRequest();
        req2.setUsername("userp2");
        req2.setPassword("pass456");
        req2.setEmail("p2@example.com");
        req2.setPhone("12345");

        DuplicateResourceException ex = Assertions.assertThrows(DuplicateResourceException.class, () ->
            userService.register(req2)
        );
        Assertions.assertEquals("手机号已被使用", ex.getMessage());
    }

    @Test
    void testDefaultProfileOnRegister() {
        UserRegistrationRequest req = new UserRegistrationRequest();
        req.setUsername("pro1");
        req.setPassword("pass");
        req.setEmail("p1@example.com");
        req.setPhone("301");
        UserResponse resp = userService.register(req);

        Assertions.assertTrue(userProfileRepository.findByUserId(resp.getId()).isPresent());
    }
}
