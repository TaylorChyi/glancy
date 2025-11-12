package com.glancy.backend.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders;
import org.springframework.test.web.servlet.result.MockMvcResultMatchers;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.glancy.backend.dto.AvatarRequest;
import com.glancy.backend.dto.AvatarResponse;
import com.glancy.backend.dto.EmailChangeInitiationRequest;
import com.glancy.backend.dto.EmailChangeRequest;
import com.glancy.backend.dto.LoginRequest;
import com.glancy.backend.dto.LoginResponse;
import com.glancy.backend.dto.ThirdPartyAccountRequest;
import com.glancy.backend.dto.ThirdPartyAccountResponse;
import com.glancy.backend.dto.UserContactRequest;
import com.glancy.backend.dto.UserContactResponse;
import com.glancy.backend.dto.UserDetailResponse;
import com.glancy.backend.dto.UserEmailResponse;
import com.glancy.backend.dto.UserRegistrationRequest;
import com.glancy.backend.dto.UserResponse;
import com.glancy.backend.entity.MembershipType;
import com.glancy.backend.entity.User;
import com.glancy.backend.service.UserService;
import com.glancy.backend.util.ClientIpResolver;
import jakarta.servlet.http.HttpServletRequest;
import java.time.LocalDateTime;
import java.util.Collections;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
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

    @MockitoBean
    private ClientIpResolver clientIpResolver;

    @Autowired
    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        when(clientIpResolver.resolve(any(HttpServletRequest.class))).thenReturn("127.0.0.1");
    }

    /**
     * 测试 register 接口
     */
    @Test
    void register() throws Exception {
        UserResponse resp = new UserResponse(
            1L,
            "testuser",
            "test@example.com",
            null,
            "555",
            false,
            MembershipType.NONE,
            null
        );
        when(userService.register(any(UserRegistrationRequest.class))).thenReturn(resp);

        UserRegistrationRequest req = new UserRegistrationRequest();
        req.setUsername("testuser");
        req.setPassword("pass123");
        req.setEmail("test@example.com");
        req.setPhone("555");

        mockMvc
            .perform(
                MockMvcRequestBuilders.post("/api/users/register")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(req))
            )
            .andExpect(MockMvcResultMatchers.status().isCreated())
            .andExpect(MockMvcResultMatchers.jsonPath("$.id").value(1L));
    }

    /**
     * 测试 deleteUser 接口
     */
    @Test
    void deleteUser() throws Exception {
        doNothing().when(userService).deleteUser(1L);
        mockMvc.perform(MockMvcRequestBuilders.delete("/api/users/1")).andExpect(MockMvcResultMatchers.status().isNoContent());
    }

    /**
     * 测试 getUser 接口
     */
    @Test
    void getUser() throws Exception {
        UserDetailResponse detailResponse = UserDetailResponse.of(
            1L,
            "u",
            "e",
            "avatar-url",
            "p1",
            false,
            MembershipType.NONE,
            null,
            false,
            LocalDateTime.of(2024, 1, 1, 8, 0),
            LocalDateTime.of(2024, 1, 2, 9, 0),
            null
        );
        when(userService.getUserDetail(1L)).thenReturn(detailResponse);

        mockMvc
            .perform(MockMvcRequestBuilders.get("/api/users/1"))
            .andExpect(MockMvcResultMatchers.status().isOk())
            .andExpect(MockMvcResultMatchers.jsonPath("$.id").value(1L))
            .andExpect(MockMvcResultMatchers.jsonPath("$.username").value("u"))
            .andExpect(MockMvcResultMatchers.jsonPath("$.email").value("e"))
            .andExpect(MockMvcResultMatchers.jsonPath("$.password").doesNotExist());
    }

    /**
     * 测试 login 接口
     */
    @Test
    void login() throws Exception {
        LoginResponse resp = new LoginResponse(1L, "u", "e", null, null, false, MembershipType.NONE, null, "tkn");
        when(userService.login(any(LoginRequest.class))).thenReturn(resp);

        LoginRequest req = new LoginRequest();
        req.setAccount("u");
        req.setPassword("pass");

        mockMvc
            .perform(
                MockMvcRequestBuilders.post("/api/users/login")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(req))
            )
            .andExpect(MockMvcResultMatchers.status().isOk())
            .andExpect(MockMvcResultMatchers.jsonPath("$.id").value(1L));
    }

    /**
     * 测试 loginWithPhone 接口
     */
    @Test
    void loginWithPhone() throws Exception {
        LoginResponse resp = new LoginResponse(1L, "u", "e", null, "555", false, MembershipType.NONE, null, "tkn");
        when(userService.login(any(LoginRequest.class))).thenReturn(resp);

        LoginRequest req = new LoginRequest();
        req.setAccount("555");
        req.setPassword("pass");

        mockMvc
            .perform(
                MockMvcRequestBuilders.post("/api/users/login")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(req))
            )
            .andExpect(MockMvcResultMatchers.status().isOk())
            .andExpect(MockMvcResultMatchers.jsonPath("$.id").value(1L));
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
                MockMvcRequestBuilders.post("/api/users/1/third-party-accounts")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(req))
            )
            .andExpect(MockMvcResultMatchers.status().isCreated())
            .andExpect(MockMvcResultMatchers.jsonPath("$.id").value(1L));
    }

    /**
     * 测试 getAvatar 接口
     */
    @Test
    void getAvatar() throws Exception {
        AvatarResponse resp = new AvatarResponse("url");
        when(userService.getAvatar(1L)).thenReturn(resp);

        mockMvc
            .perform(MockMvcRequestBuilders.get("/api/users/1/avatar"))
            .andExpect(MockMvcResultMatchers.status().isOk())
            .andExpect(MockMvcResultMatchers.jsonPath("$.avatar").value("url"));
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
                MockMvcRequestBuilders.put("/api/users/1/avatar")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(req))
            )
            .andExpect(MockMvcResultMatchers.status().isOk())
            .andExpect(MockMvcResultMatchers.jsonPath("$.avatar").value("url"));
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
                MockMvcRequestBuilders.put("/api/users/1/contact")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(req))
            )
            .andExpect(MockMvcResultMatchers.status().isOk())
            .andExpect(MockMvcResultMatchers.jsonPath("$.email").value("changed@example.com"))
            .andExpect(MockMvcResultMatchers.jsonPath("$.phone").value("7654321"));
    }

    /**
     * 验证 requestEmailChangeCode 接口能接受请求并返回 202。
     */
    @Test
    void requestEmailChangeCode() throws Exception {
        doNothing().when(userService).requestEmailChangeCode(1L, "next@example.com", "127.0.0.1");

        EmailChangeInitiationRequest req = new EmailChangeInitiationRequest("next@example.com");

        mockMvc
            .perform(
                MockMvcRequestBuilders.post("/api/users/1/email/change-code")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(req))
            )
            .andExpect(MockMvcResultMatchers.status().isAccepted());
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
                MockMvcRequestBuilders.put("/api/users/1/email")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(req))
            )
            .andExpect(MockMvcResultMatchers.status().isOk())
            .andExpect(MockMvcResultMatchers.jsonPath("$.email").value("next@example.com"));
    }

    /**
     * 验证 unbindEmail 接口返回空邮箱信息。
     */
    @Test
    void unbindEmail() throws Exception {
        when(userService.unbindEmail(1L)).thenReturn(new UserEmailResponse(null));

        mockMvc
            .perform(MockMvcRequestBuilders.delete("/api/users/1/email"))
            .andExpect(MockMvcResultMatchers.status().isOk())
            .andExpect(MockMvcResultMatchers.jsonPath("$.email").value(org.hamcrest.Matchers.nullValue()));
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
            .perform(MockMvcRequestBuilders.multipart("/api/users/1/avatar-file").file(file))
            .andExpect(MockMvcResultMatchers.status().isOk())
            .andExpect(MockMvcResultMatchers.jsonPath("$.avatar").value("path/url.jpg"));
    }

    /**
     * 测试 logout 接口
     */
    @Test
    void logout() throws Exception {
        User authenticated = new User();
        authenticated.setId(1L);
        authenticated.setLoginToken("tkn");
        when(userService.getUserRaw(1L)).thenReturn(authenticated);
        doNothing().when(userService).logout(1L, "tkn");

        SecurityContextHolder.getContext().setAuthentication(
            new UsernamePasswordAuthenticationToken(1L, "tkn", Collections.emptyList())
        );

        try {
            mockMvc.perform(MockMvcRequestBuilders.post("/api/users/1/logout")).andExpect(MockMvcResultMatchers.status().isNoContent());
        } finally {
            SecurityContextHolder.clearContext();
        }

        verify(userService).logout(1L, "tkn");
    }

    /**
     * 测试 countUsers 接口
     */
    @Test
    void countUsers() throws Exception {
        when(userService.countActiveUsers()).thenReturn(5L);
        mockMvc.perform(MockMvcRequestBuilders.get("/api/users/count")).andExpect(MockMvcResultMatchers.status().isOk()).andExpect(MockMvcResultMatchers.content().string("5"));
    }
}
