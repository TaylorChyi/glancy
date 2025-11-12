package com.glancy.backend.service;

import com.glancy.backend.dto.AvatarResponse;
import com.glancy.backend.dto.UserRegistrationRequest;
import com.glancy.backend.dto.UserResponse;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.web.multipart.MultipartFile;

class UserServiceAvatarTest extends AbstractUserServiceTest {

    @Test
    void testUpdateAvatar() {
        UserRegistrationRequest req = new UserRegistrationRequest();
        req.setUsername("avataruser");
        req.setPassword("pass123");
        req.setEmail("avatar@example.com");
        req.setPhone("104");
        UserResponse resp = userService.register(req);

        AvatarResponse updated = userService.updateAvatar(resp.getId(), "url");
        Assertions.assertEquals("url", updated.getAvatar());

        AvatarResponse fetched = userService.getAvatar(resp.getId());
        Assertions.assertEquals("url", fetched.getAvatar());
    }

    @Test
    void testUploadAvatar() throws Exception {
        UserRegistrationRequest req = new UserRegistrationRequest();
        req.setUsername("uploaduser");
        req.setPassword("pass");
        req.setEmail("up@example.com");
        req.setPhone("109");
        UserResponse resp = userService.register(req);

        MultipartFile file = Mockito.mock(MultipartFile.class);
        Mockito.when(avatarStorage.upload(file)).thenReturn("path/url.jpg");

        AvatarResponse result = userService.uploadAvatar(resp.getId(), file);
        Assertions.assertEquals("path/url.jpg", result.getAvatar());
    }
}
