package com.glancy.backend.service;

import com.glancy.backend.dto.LoginRequest;
import com.glancy.backend.dto.UserRegistrationRequest;
import com.glancy.backend.dto.UserResponse;
import com.glancy.backend.entity.LoginDevice;
import java.util.List;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

class UserServiceAuthTest extends AbstractUserServiceTest {

    @Test
    void testLoginDeviceLimit() {
        UserRegistrationRequest req = new UserRegistrationRequest();
        req.setUsername("deviceuser");
        req.setPassword("pass123");
        req.setEmail("device@example.com");
        req.setPhone("103");
        UserResponse resp = userService.register(req);

        LoginRequest loginReq = new LoginRequest();
        loginReq.setAccount("deviceuser");
        loginReq.setPassword("pass123");

        loginReq.setDeviceInfo("d1");
        userService.login(loginReq);
        loginReq.setDeviceInfo("d2");
        userService.login(loginReq);
        loginReq.setDeviceInfo("d3");
        userService.login(loginReq);
        loginReq.setDeviceInfo("d4");
        userService.login(loginReq);

        List<LoginDevice> devices = loginDeviceRepository.findByUserIdOrderByLoginTimeAsc(resp.getId());
        Assertions.assertEquals(3, devices.size());
        Assertions.assertFalse(devices.stream().anyMatch(d -> "d1".equals(d.getDeviceInfo())));
    }

    @Test
    void testLoginByPhone() {
        UserRegistrationRequest req = new UserRegistrationRequest();
        req.setUsername("phoneuser");
        req.setPassword("pass123");
        req.setEmail("phone@example.com");
        req.setPhone("555");
        userService.register(req);

        LoginRequest loginReq = new LoginRequest();
        loginReq.setAccount("555");
        loginReq.setPassword("pass123");

        Assertions.assertNotNull(userService.login(loginReq).getToken());
    }

    @Test
    void testLogout() {
        UserRegistrationRequest req = new UserRegistrationRequest();
        req.setUsername("logoutuser");
        req.setPassword("pass123");
        req.setEmail("logout@example.com");
        req.setPhone("888");
        UserResponse resp = userService.register(req);

        LoginRequest loginReq = new LoginRequest();
        loginReq.setAccount("logoutuser");
        loginReq.setPassword("pass123");
        String token = userService.login(loginReq).getToken();

        userService.logout(resp.getId(), token);

        Assertions.assertNull(userRepository.findById(resp.getId()).orElseThrow().getLoginToken());
    }
}
