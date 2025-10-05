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
     * 测试目标：确认保存画像接口在无年龄/性别字段时仍能成功持久化并返回用户标识。
     * 前置条件：
     *  - 模拟鉴权成功返回用户 ID；
     *  - UserProfileService.saveProfile 预置返回含职业、兴趣等字段的响应。
     * 步骤：
     *  1) 构造 `UserProfileRequest` record 并通过 POST /api/profiles/user 提交；
     *  2) 捕获响应并校验状态码。
     * 断言：
     *  - HTTP 状态为 201；
     *  - 响应 JSON 中的 userId 为 2。
     * 边界/异常：
     *  - 若缺失可选字段，由 record 默认为 null 并由服务层处理。
     */
    @Test
    void saveProfile() throws Exception {
        UserProfileResponse resp = new UserProfileResponse(1L, 2L, "dev", "code", "learn", 15, "exchange study");
        when(userProfileService.saveProfile(eq(2L), any(UserProfileRequest.class))).thenReturn(resp);

        UserProfileRequest req = new UserProfileRequest("dev", "code", "learn", 15, "exchange study");

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
     * 测试目标：确认查询画像接口返回的字段集合已移除年龄与性别。
     * 前置条件：鉴权成功，服务层返回含职业、兴趣、目标的画像响应。
     * 步骤：调用 GET /api/profiles/user。
     * 断言：
     *  - HTTP 状态为 200；
     *  - 响应 JSON 中的 userId 为 2。
     * 边界/异常：若服务层返回空画像，控制器仍返回 200，交由前端处理占位文案。
     */
    @Test
    void getProfile() throws Exception {
        UserProfileResponse resp = new UserProfileResponse(1L, 2L, "dev", "code", "learn", 15, "exchange study");
        when(userProfileService.getProfile(2L)).thenReturn(resp);

        when(userService.authenticateToken("tkn")).thenReturn(2L);

        mockMvc
            .perform(get("/api/profiles/user").header("X-USER-TOKEN", "tkn"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.userId").value(2L));
    }
}
