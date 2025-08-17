package com.glancy.backend.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;

import com.glancy.backend.dto.TtsRequest;
import com.glancy.backend.dto.TtsResponse;
import com.glancy.backend.dto.VoiceOption;
import com.glancy.backend.dto.VoiceResponse;
import com.glancy.backend.service.UserService;
import com.glancy.backend.service.tts.TtsService;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

/**
 * Tests for {@link TtsController}. The focus is on verifying the
 * HTTP contract and parameter handling rather than synthesis logic.
 */
@WebMvcTest(TtsController.class)
@Import(
    {
        com.glancy.backend.config.security.SecurityConfig.class,
        com.glancy.backend.config.WebConfig.class,
        com.glancy.backend.config.auth.AuthenticatedUserArgumentResolver.class,
    }
)
class TtsControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private TtsService ttsService;

    @MockitoBean
    private UserService userService;


    /**
     * Verify that a successful word synthesis returns audio bytes and headers.
     */
    @Test
    void synthesizeWordReturnsAudio() throws Exception {
        byte[] data = "data".getBytes(StandardCharsets.UTF_8);
        TtsResponse resp = new TtsResponse(data, 1000L, "mp3", true, "obj");
        when(ttsService.synthesizeWord(eq(1L), anyString(), any(TtsRequest.class))).thenReturn(Optional.of(resp));
        when(userService.authenticateToken("tkn")).thenReturn(1L);

        mockMvc
            .perform(
                post("/api/tts/word")
                    .header("X-USER-TOKEN", "tkn")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"text\":\"hello\",\"lang\":\"en\"}")
            )
            .andExpect(status().isOk())
            .andExpect(header().string("X-From-Cache", "true"))
            .andExpect(content().bytes(data));
    }

    /**
     * When the service indicates a cache miss, the controller should
     * respond with 204 to signal the client to retry without shortcut.
     */
    @Test
    void synthesizeWordCacheMissReturns204() throws Exception {
        when(ttsService.synthesizeWord(eq(1L), anyString(), any(TtsRequest.class))).thenReturn(Optional.empty());
        when(userService.authenticateToken("tkn")).thenReturn(1L);

        mockMvc
            .perform(
                post("/api/tts/word")
                    .header("X-USER-TOKEN", "tkn")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"text\":\"hello\",\"lang\":\"en\"}")
            )
            .andExpect(status().isNoContent());
    }

    /**
     * Ensure the voices endpoint returns voice data as provided by
     * the service.
     */
    @Test
    void listVoicesReturnsOptions() throws Exception {
        VoiceResponse resp = new VoiceResponse("v1", List.of(new VoiceOption("v1", "label", "all")));
        when(ttsService.listVoices(eq(1L), eq("en"))).thenReturn(resp);
        when(userService.authenticateToken("tkn")).thenReturn(1L);

        mockMvc
            .perform(get("/api/tts/voices").header("X-USER-TOKEN", "tkn").param("lang", "en"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.default").value("v1"))
            .andExpect(jsonPath("$.options[0].id").value("v1"));
    }

    /**
     * GET variant for sentence synthesis should return audio bytes.
     */
    @Test
    void streamSentenceReturnsBytes() throws Exception {
        byte[] data = "data".getBytes(StandardCharsets.UTF_8);
        TtsResponse resp = new TtsResponse(data, 800L, "mp3", false, "obj");
        when(ttsService.synthesizeSentence(eq(1L), anyString(), any(TtsRequest.class))).thenReturn(Optional.of(resp));
        when(userService.authenticateToken("tkn")).thenReturn(1L);

        mockMvc
            .perform(
                get("/api/tts/sentence")
                    .param("text", "hello world")
                    .param("lang", "en")
                    .header("X-USER-TOKEN", "tkn")
            )
            .andExpect(status().isOk())
            .andExpect(content().bytes(data));
    }

    /**
     * GET endpoint for single word pronunciations returns audio bytes.
     */
    @Test
    void streamWordReturnsBytes() throws Exception {
        byte[] data = "data".getBytes(StandardCharsets.UTF_8);
        TtsResponse resp = new TtsResponse(data, 500L, "mp3", true, "obj");
        when(ttsService.synthesizeWord(eq(1L), anyString(), any(TtsRequest.class))).thenReturn(Optional.of(resp));
        when(userService.authenticateToken("tkn")).thenReturn(1L);

        mockMvc
            .perform(get("/api/tts/word").param("text", "hello").param("lang", "en").header("X-USER-TOKEN", "tkn"))
            .andExpect(status().isOk())
            .andExpect(content().bytes(data));
    }
}
