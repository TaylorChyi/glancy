package com.glancy.backend.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.glancy.backend.dto.UserProfileRequest;
import com.glancy.backend.dto.UserProfileResponse;
import com.glancy.backend.service.UserProfileService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(UserProfileController.class)
@Import(
    {
        com.glancy.backend.config.security.SecurityConfig.class,
        com.glancy.backend.config.WebConfig.class,
        com.glancy.backend.config.auth.AuthenticatedUserArgumentResolver.class,
    }
)
class UserProfileControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private UserProfileService userProfileService;

    @MockitoBean
    private com.glancy.backend.service.UserService userService;

    @Autowired
    private ObjectMapper objectMapper;

    /**
     * 测试 saveProfile 接口：
     * 1. 构造包含完整画像信息的请求体并模拟用户身份认证；
     * 2. 预置 UserProfileService 保存逻辑返回的画像响应；
     * 3. 通过 MockMvc 触发 POST 请求，断言 HTTP 状态码以及响应中的 userId 字段与预期一致。
     */
    @Test
    void saveProfile() throws Exception {
        UserProfileResponse resp = new UserProfileResponse(
            1L,
            2L,
            20,
            "M",
            "dev",
            "code",
            "learn",
            15,
            "exchange study"
        );
        when(userProfileService.saveProfile(eq(2L), any(UserProfileRequest.class))).thenReturn(resp);

        UserProfileRequest req = new UserProfileRequest();
        req.setAge(20);
        req.setGender("M");
        req.setJob("dev");
        req.setInterest("code");
        req.setGoal("learn");
        req.setDailyWordTarget(15);
        req.setFuturePlan("exchange study");

        when(userService.authenticateToken("tkn")).thenReturn(2L);

        mockMvc
            .perform(
                post("/api/profiles/user")
                    .header("X-USER-TOKEN", "tkn")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(req))
            )
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.userId").value(2L));
    }

    /**
     * 测试 getProfile 接口：
     * 1. 模拟用户身份认证返回用户主键；
     * 2. 预置画像查询服务返回完整画像信息；
     * 3. 通过 GET 请求校验接口响应状态码及 userId 字段。
     */
    @Test
    void getProfile() throws Exception {
        UserProfileResponse resp = new UserProfileResponse(
            1L,
            2L,
            20,
            "M",
            "dev",
            "code",
            "learn",
            15,
            "exchange study"
        );
        when(userProfileService.getProfile(2L)).thenReturn(resp);

        when(userService.authenticateToken("tkn")).thenReturn(2L);

        mockMvc
            .perform(get("/api/profiles/user").header("X-USER-TOKEN", "tkn"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.userId").value(2L));
    }
}
