package com.glancy.backend.controller;

import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.glancy.backend.entity.User;
import com.glancy.backend.service.UserService;
import com.glancy.backend.service.tts.client.VolcengineTtsClient;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

/**
 * Integration tests verifying that request validation failures in TTS
 * endpoints yield appropriate HTTP responses.
 */
@SpringBootTest(properties = "tts.config-path=src/test/resources/tts-config-it.yml")
@AutoConfigureMockMvc
class TtsControllerValidationIT {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private VolcengineTtsClient ttsClient;

    @MockitoBean
    private UserService userService;

    /**
     * Invalid language codes should result in HTTP 422.
     */
    @Test
    void synthesizeWordWithUnsupportedLanguageReturns422() throws Exception {
        User user = new User();
        user.setId(1L);
        user.setMember(true);
        when(userService.getUserRaw(1L)).thenReturn(user);
        doNothing().when(userService).validateToken(1L, "tkn");

        mockMvc
            .perform(
                post("/api/tts/word")
                    .param("userId", "1")
                    .header("X-USER-TOKEN", "tkn")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"text\":\"hi\",\"lang\":\"fr\"}")
            )
            .andExpect(status().isUnprocessableEntity());
    }

    /**
     * Non-member users requesting pro-only voices should receive HTTP 403.
     */
    @Test
    void synthesizeSentenceWithProVoiceByFreeUserReturns403() throws Exception {
        User user = new User();
        user.setId(1L);
        user.setMember(false);
        when(userService.getUserRaw(1L)).thenReturn(user);
        doNothing().when(userService).validateToken(1L, "tkn");

        mockMvc
            .perform(
                post("/api/tts/sentence")
                    .param("userId", "1")
                    .header("X-USER-TOKEN", "tkn")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"text\":\"hello\",\"lang\":\"en\",\"voice\":\"v2\"}")
            )
            .andExpect(status().isForbidden());
    }
}
