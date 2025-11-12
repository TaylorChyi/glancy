package com.glancy.backend.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.glancy.backend.dto.ProfileCustomSectionDto;
import com.glancy.backend.dto.ProfileCustomSectionItemDto;
import com.glancy.backend.dto.UserProfileRequest;
import com.glancy.backend.dto.UserProfileResponse;
import com.glancy.backend.service.UserProfileService;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders;
import org.springframework.test.web.servlet.result.MockMvcResultMatchers;

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

    @BeforeEach
    void mockAuth() {
        when(userService.authenticateToken("tkn")).thenReturn(2L);
    }

    @Test
    void saveProfile() throws Exception {
        when(userProfileService.saveProfile(eq(2L), any(UserProfileRequest.class))).thenReturn(profileResponse());

        mockMvc
            .perform(
                MockMvcRequestBuilders.post("/api/profiles/user")
                    .header("X-USER-TOKEN", "tkn")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(profileRequest()))
            )
            .andExpect(MockMvcResultMatchers.status().isCreated())
            .andExpect(MockMvcResultMatchers.jsonPath("$.userId").value(2L));
    }

    /**
     * 测试目标：确认查询画像接口返回的字段集合包含新增的学历、能力与自定义大项字段。
     * 前置条件：鉴权成功，服务层返回含新增字段的画像响应。
     * 步骤：调用 GET /api/profiles/user。
     * 断言：
     *  - HTTP 状态为 200；
     *  - 响应 JSON 中的 userId 为 2。
     * 边界/异常：若服务层返回空画像，控制器仍返回 200，交由前端处理占位文案。
     */
    @Test
    void getProfile() throws Exception {
        when(userProfileService.getProfile(2L)).thenReturn(profileResponse());

        mockMvc
            .perform(MockMvcRequestBuilders.get("/api/profiles/user").header("X-USER-TOKEN", "tkn"))
            .andExpect(MockMvcResultMatchers.status().isOk())
            .andExpect(MockMvcResultMatchers.jsonPath("$.userId").value(2L));
    }

    private List<ProfileCustomSectionDto> customSections() {
        return List.of(
            new ProfileCustomSectionDto("作品集", List.of(new ProfileCustomSectionItemDto("近期项目", "AI 口语教练")))
        );
    }

    private UserProfileRequest profileRequest() {
        return new UserProfileRequest(
            "dev",
            "code",
            "learn",
            "master",
            "B2",
            15,
            "exchange study",
            "沉稳而有条理",
            customSections()
        );
    }

    private UserProfileResponse profileResponse() {
        return new UserProfileResponse(
            1L,
            2L,
            "dev",
            "code",
            "learn",
            "master",
            "B2",
            15,
            "exchange study",
            "沉稳而有条理",
            customSections()
        );
    }
}
