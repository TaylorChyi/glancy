package com.glancy.backend.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.glancy.backend.dto.*;
import com.glancy.backend.entity.User;
import com.glancy.backend.service.UserService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.web.multipart.MultipartFile;

@WebMvcTest(UserController.class)
@Import(
    {
        com.glancy.backend.config.security.SecurityConfig.class,
        com.glancy.backend.config.WebConfig.class,
        com.glancy.backend.config.auth.AuthenticatedUserArgumentResolver.class,
    }
)
class UserControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private UserService userService;

    @Autowired
    private ObjectMapper objectMapper;

    /**
     * 测试 register 接口
     */
    @Test
    void register() throws Exception {
        UserResponse resp = new UserResponse(1L, "testuser", "test@example.com", null, "555");
        when(userService.register(any(UserRegistrationRequest.class))).thenReturn(resp);

        UserRegistrationRequest req = new UserRegistrationRequest();
        req.setUsername("testuser");
        req.setPassword("pass123");
        req.setEmail("test@example.com");
        req.setPhone("555");

        mockMvc
            .perform(
                post("/api/users/register")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(req))
            )
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.id").value(1L));
    }

    /**
     * 测试 deleteUser 接口
     */
    @Test
    void deleteUser() throws Exception {
        doNothing().when(userService).deleteUser(1L);
        mockMvc.perform(delete("/api/users/1")).andExpect(status().isNoContent());
    }

    /**
     * 测试 getUser 接口
     */
    @Test
    void getUser() throws Exception {
        User user = new User();
        user.setId(1L);
        user.setUsername("u");
        user.setPassword("p");
        user.setEmail("e");
        user.setPhone("p1");
        when(userService.getUserRaw(1L)).thenReturn(user);

        mockMvc
            .perform(get("/api/users/1"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.id").value(1L))
            .andExpect(jsonPath("$.password").doesNotExist());
    }

    /**
     * 测试 login 接口
     */
    @Test
    void login() throws Exception {
        LoginResponse resp = new LoginResponse(1L, "u", "e", null, null, false, null, null, "tkn");
        when(userService.login(any(LoginRequest.class))).thenReturn(resp);

        LoginRequest req = new LoginRequest();
        req.setAccount("u");
        req.setPassword("pass");

        mockMvc
            .perform(
                post("/api/users/login")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(req))
            )
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.id").value(1L));
    }

    /**
     * 测试 loginWithPhone 接口
     */
    @Test
    void loginWithPhone() throws Exception {
        LoginResponse resp = new LoginResponse(1L, "u", "e", null, "555", false, null, null, "tkn");
        when(userService.login(any(LoginRequest.class))).thenReturn(resp);

        LoginRequest req = new LoginRequest();
        req.setAccount("555");
        req.setPassword("pass");

        mockMvc
            .perform(
                post("/api/users/login")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(req))
            )
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.id").value(1L));
    }

    /**
     * 测试 bindThirdParty 接口
     */
    @Test
    void bindThirdParty() throws Exception {
        ThirdPartyAccountResponse resp = new ThirdPartyAccountResponse(1L, "p", "e", 1L);
        when(userService.bindThirdPartyAccount(eq(1L), any(ThirdPartyAccountRequest.class))).thenReturn(resp);

        ThirdPartyAccountRequest req = new ThirdPartyAccountRequest();
        req.setProvider("p");
        req.setExternalId("e");

        mockMvc
            .perform(
                post("/api/users/1/third-party-accounts")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(req))
            )
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.id").value(1L));
    }

    /**
     * 测试 getAvatar 接口
     */
    @Test
    void getAvatar() throws Exception {
        AvatarResponse resp = new AvatarResponse("url");
        when(userService.getAvatar(1L)).thenReturn(resp);

        mockMvc
            .perform(get("/api/users/1/avatar"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.avatar").value("url"));
    }

    /**
     * 测试 updateAvatar 接口
     */
    @Test
    void updateAvatar() throws Exception {
        AvatarResponse resp = new AvatarResponse("url");
        when(userService.updateAvatar(eq(1L), eq("url"))).thenReturn(resp);

        AvatarRequest req = new AvatarRequest();
        req.setAvatar("url");

        mockMvc
            .perform(
                put("/api/users/1/avatar")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(req))
            )
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.avatar").value("url"));
    }

    /**
     * 测试 updateContact 接口
     */
    @Test
    void updateContact() throws Exception {
        UserContactResponse resp = new UserContactResponse("changed@example.com", "7654321");
        when(userService.updateContact(eq(1L), eq("changed@example.com"), eq("7654321"))).thenReturn(resp);

        UserContactRequest req = new UserContactRequest("changed@example.com", "7654321");

        mockMvc
            .perform(
                put("/api/users/1/contact")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(req))
            )
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.email").value("changed@example.com"))
            .andExpect(jsonPath("$.phone").value("7654321"));
    }

    /**
     * 验证 requestEmailChangeCode 接口能接受请求并返回 202。
     */
    @Test
    void requestEmailChangeCode() throws Exception {
        doNothing().when(userService).requestEmailChangeCode(1L, "next@example.com");

        EmailChangeInitiationRequest req = new EmailChangeInitiationRequest("next@example.com");

        mockMvc
            .perform(
                post("/api/users/1/email/change-code")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(req))
            )
            .andExpect(status().isAccepted());
    }

    /**
     * 验证 changeEmail 接口成功返回最新邮箱信息。
     */
    @Test
    void changeEmail() throws Exception {
        when(userService.changeEmail(1L, "next@example.com", "123456")).thenReturn(
            new UserEmailResponse("next@example.com")
        );

        EmailChangeRequest req = new EmailChangeRequest("next@example.com", "123456");

        mockMvc
            .perform(
                put("/api/users/1/email")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(req))
            )
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.email").value("next@example.com"));
    }

    /**
     * 验证 unbindEmail 接口返回空邮箱信息。
     */
    @Test
    void unbindEmail() throws Exception {
        when(userService.unbindEmail(1L)).thenReturn(new UserEmailResponse(null));

        mockMvc
            .perform(delete("/api/users/1/email"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.email").value(org.hamcrest.Matchers.nullValue()));
    }

    /**
     * 测试 uploadAvatar 接口
     */
    @Test
    void uploadAvatar() throws Exception {
        MockMultipartFile file = new MockMultipartFile("file", "a.jpg", "image/jpeg", "xx".getBytes());
        AvatarResponse resp = new AvatarResponse("path/url.jpg");
        when(userService.uploadAvatar(eq(1L), any(MultipartFile.class))).thenReturn(resp);

        mockMvc
            .perform(multipart("/api/users/1/avatar-file").file(file))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.avatar").value("path/url.jpg"));
    }

    /**
     * 测试 logout 接口
     */
    @Test
    void logout() throws Exception {
        doNothing().when(userService).logout(1L, "tkn");

        mockMvc.perform(post("/api/users/1/logout").header("X-USER-TOKEN", "tkn")).andExpect(status().isNoContent());
    }

    /**
     * 测试 countUsers 接口
     */
    @Test
    void countUsers() throws Exception {
        when(userService.countActiveUsers()).thenReturn(5L);
        mockMvc.perform(get("/api/users/count")).andExpect(status().isOk()).andExpect(content().string("5"));
    }
}
