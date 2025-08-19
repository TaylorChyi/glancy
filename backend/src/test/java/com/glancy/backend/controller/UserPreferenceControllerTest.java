package com.glancy.backend.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.glancy.backend.dto.UserPreferenceRequest;
import com.glancy.backend.dto.UserPreferenceResponse;
import com.glancy.backend.entity.DictionaryModel;
import com.glancy.backend.service.UserPreferenceService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(UserPreferenceController.class)
@Import(
    {
        com.glancy.backend.config.security.SecurityConfig.class,
        com.glancy.backend.config.WebConfig.class,
        com.glancy.backend.config.auth.AuthenticatedUserArgumentResolver.class,
    }
)
class UserPreferenceControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private UserPreferenceService userPreferenceService;

    @MockBean
    private com.glancy.backend.service.UserService userService;

    @Autowired
    private ObjectMapper objectMapper;

    /**
     * 测试 savePreference 接口
     */
    @Test
    void savePreference() throws Exception {
        UserPreferenceResponse resp = new UserPreferenceResponse(1L, 2L, "dark", "en", "en", DictionaryModel.DEEPSEEK);
        when(userPreferenceService.savePreference(eq(2L), any(UserPreferenceRequest.class))).thenReturn(resp);

        UserPreferenceRequest req = new UserPreferenceRequest();
        req.setTheme("dark");
        req.setSystemLanguage("en");
        req.setSearchLanguage("en");
        req.setDictionaryModel(DictionaryModel.DEEPSEEK);

        when(userService.authenticateToken("tkn")).thenReturn(2L);

        mockMvc
            .perform(
                post("/api/preferences/user")
                    .header("X-USER-TOKEN", "tkn")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(req))
            )
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.userId").value(2L));
    }

    /**
     * 测试 getPreference 接口
     */
    @Test
    void getPreference() throws Exception {
        UserPreferenceResponse resp = new UserPreferenceResponse(1L, 2L, "dark", "en", "en", DictionaryModel.DEEPSEEK);
        when(userPreferenceService.getPreference(2L)).thenReturn(resp);

        when(userService.authenticateToken("tkn")).thenReturn(2L);

        mockMvc
            .perform(get("/api/preferences/user").header("X-USER-TOKEN", "tkn"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.userId").value(2L));
    }
}
