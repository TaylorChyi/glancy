package com.glancy.backend.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.glancy.backend.dto.UserPreferenceRequest;
import com.glancy.backend.dto.UserPreferenceResponse;
import com.glancy.backend.dto.UserPreferenceUpdateRequest;
import com.glancy.backend.service.UserPreferenceService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders;
import org.springframework.test.web.servlet.result.MockMvcResultMatchers;

@WebMvcTest(UserPreferenceController.class)
@Import({
  com.glancy.backend.config.security.SecurityConfig.class,
  com.glancy.backend.config.WebConfig.class,
  com.glancy.backend.config.auth.AuthenticatedUserArgumentResolver.class,
})
class UserPreferenceControllerTest {

  @Autowired private MockMvc mockMvc;

  @MockitoBean private UserPreferenceService userPreferenceService;

  @MockitoBean private com.glancy.backend.service.UserService userService;

  @Autowired private ObjectMapper objectMapper;

  /** 测试 savePreference 接口 */
  @Test
  void savePreference() throws Exception {
    UserPreferenceResponse resp = new UserPreferenceResponse(1L, 2L, "dark", "en", "en");
    when(userPreferenceService.savePreference(eq(2L), any(UserPreferenceRequest.class)))
        .thenReturn(resp);

    UserPreferenceRequest req = new UserPreferenceRequest();
    req.setTheme("dark");
    req.setSystemLanguage("en");
    req.setSearchLanguage("en");

    when(userService.authenticateToken("tkn")).thenReturn(2L);

    mockMvc
        .perform(
            MockMvcRequestBuilders.post("/api/preferences/user")
                .header("X-USER-TOKEN", "tkn")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
        .andExpect(MockMvcResultMatchers.status().isCreated())
        .andExpect(MockMvcResultMatchers.jsonPath("$.userId").value(2L));
  }

  /** 测试 getPreference 接口 */
  @Test
  void getPreference() throws Exception {
    UserPreferenceResponse resp = new UserPreferenceResponse(1L, 2L, "dark", "en", "en");
    when(userPreferenceService.getPreference(2L)).thenReturn(resp);

    when(userService.authenticateToken("tkn")).thenReturn(2L);

    mockMvc
        .perform(MockMvcRequestBuilders.get("/api/preferences/user").header("X-USER-TOKEN", "tkn"))
        .andExpect(MockMvcResultMatchers.status().isOk())
        .andExpect(MockMvcResultMatchers.jsonPath("$.userId").value(2L));
  }

  /** 测试 updatePreference 接口 */
  @Test
  void updatePreference() throws Exception {
    UserPreferenceResponse resp = new UserPreferenceResponse(1L, 2L, "dark", "en", "en");
    when(userPreferenceService.updatePreference(eq(2L), any(UserPreferenceUpdateRequest.class)))
        .thenReturn(resp);

    UserPreferenceUpdateRequest req = new UserPreferenceUpdateRequest();
    req.setTheme("dark");

    when(userService.authenticateToken("tkn")).thenReturn(2L);

    mockMvc
        .perform(
            MockMvcRequestBuilders.patch("/api/preferences/user")
                .header("X-USER-TOKEN", "tkn")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
        .andExpect(MockMvcResultMatchers.status().isOk())
        .andExpect(MockMvcResultMatchers.jsonPath("$.theme").value("dark"));
  }
}
