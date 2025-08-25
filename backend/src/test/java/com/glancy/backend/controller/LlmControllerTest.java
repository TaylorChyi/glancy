package com.glancy.backend.controller;

import static org.mockito.BDDMockito.given;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultHandlers.print;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import com.glancy.backend.service.LlmModelService;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.context.annotation.Import;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(LlmController.class)
@Import(
    {
        com.glancy.backend.config.security.SecurityConfig.class,
        com.glancy.backend.config.WebConfig.class,
        com.glancy.backend.config.auth.AuthenticatedUserArgumentResolver.class,
    }
)
class LlmControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private LlmModelService modelService;

    @MockitoBean
    private com.glancy.backend.service.UserService userService;

    @Test
    void getModels() throws Exception {
        given(modelService.getModelNames()).willReturn(List.of("deepseek", "doubao"));
        mockMvc
            .perform(get("/api/llm/models"))
            .andDo(print())
            .andExpect(status().isOk())
            .andExpect(jsonPath("$[0]").value("deepseek"))
            .andExpect(jsonPath("$[1]").value("doubao"));
    }
}
