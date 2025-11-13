package com.glancy.backend.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.when;

import com.glancy.backend.dto.AvatarRequest;
import com.glancy.backend.dto.AvatarResponse;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders;
import org.springframework.test.web.servlet.result.MockMvcResultMatchers;
import org.springframework.web.multipart.MultipartFile;

@WebMvcTest(UserController.class)
@Import({
    com.glancy.backend.config.security.SecurityConfig.class,
    com.glancy.backend.config.WebConfig.class,
    com.glancy.backend.config.auth.AuthenticatedUserArgumentResolver.class,
})
class UserControllerPermissionTest extends BaseUserControllerWebMvcTest {

    @Test
    void deleteUser() throws Exception {
        doNothing().when(userService).deleteUser(1L);
        mockMvc.perform(MockMvcRequestBuilders.delete("/api/users/1"))
                .andExpect(MockMvcResultMatchers.status().isNoContent());
    }

    @Test
    void getAvatar() throws Exception {
        AvatarResponse resp = new AvatarResponse("url");
        when(userService.getAvatar(1L)).thenReturn(resp);

        mockMvc.perform(MockMvcRequestBuilders.get("/api/users/1/avatar"))
                .andExpect(MockMvcResultMatchers.status().isOk())
                .andExpect(MockMvcResultMatchers.jsonPath("$.avatar").value("url"));
    }

    @Test
    void updateAvatar() throws Exception {
        AvatarResponse resp = new AvatarResponse("url");
        when(userService.updateAvatar(eq(1L), eq("url"))).thenReturn(resp);

        AvatarRequest req = new AvatarRequest();
        req.setAvatar("url");

        mockMvc.perform(MockMvcRequestBuilders.put("/api/users/1/avatar")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(MockMvcResultMatchers.status().isOk())
                .andExpect(MockMvcResultMatchers.jsonPath("$.avatar").value("url"));
    }

    @Test
    void uploadAvatar() throws Exception {
        MockMultipartFile file = new MockMultipartFile("file", "a.jpg", "image/jpeg", "xx".getBytes());
        AvatarResponse resp = new AvatarResponse("path/url.jpg");
        when(userService.uploadAvatar(eq(1L), any(MultipartFile.class))).thenReturn(resp);

        mockMvc.perform(MockMvcRequestBuilders.multipart("/api/users/1/avatar-file")
                        .file(file))
                .andExpect(MockMvcResultMatchers.status().isOk())
                .andExpect(MockMvcResultMatchers.jsonPath("$.avatar").value("path/url.jpg"));
    }

    @Test
    void countUsers() throws Exception {
        when(userService.countActiveUsers()).thenReturn(5L);
        mockMvc.perform(MockMvcRequestBuilders.get("/api/users/count"))
                .andExpect(MockMvcResultMatchers.status().isOk())
                .andExpect(MockMvcResultMatchers.content().string("5"));
    }
}
