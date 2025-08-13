package com.glancy.backend.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

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
import org.springframework.web.client.RestTemplate;

/**
 * Tests for {@link TtsController}. The focus is on verifying the
 * HTTP contract and parameter handling rather than synthesis logic.
 */
@WebMvcTest(TtsController.class)
@Import(
    {
        com.glancy.backend.config.SecurityConfig.class,
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

    @MockitoBean
    private RestTemplate restTemplate;

    /**
     * Verify that a successful word synthesis returns the payload
     * from the service layer.
     */
    @Test
    void synthesizeWordReturnsAudio() throws Exception {
        TtsResponse resp = new TtsResponse("url", 1000L, "mp3", true, "obj");
        when(ttsService.synthesizeWord(eq(1L), anyString(), any(TtsRequest.class))).thenReturn(Optional.of(resp));
        doNothing().when(userService).validateToken(1L, "tkn");

        mockMvc
            .perform(
                post("/api/tts/word")
                    .param("userId", "1")
                    .header("X-USER-TOKEN", "tkn")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"text\":\"hello\",\"lang\":\"en\"}")
            )
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.url").value("url"))
            .andExpect(jsonPath("$.from_cache").value(true));
    }

    /**
     * When the service indicates a cache miss, the controller should
     * respond with 204 to signal the client to retry without shortcut.
     */
    @Test
    void synthesizeWordCacheMissReturns204() throws Exception {
        when(ttsService.synthesizeWord(eq(1L), anyString(), any(TtsRequest.class))).thenReturn(Optional.empty());
        doNothing().when(userService).validateToken(1L, "tkn");

        mockMvc
            .perform(
                post("/api/tts/word")
                    .param("userId", "1")
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
        doNothing().when(userService).validateToken(1L, "tkn");

        mockMvc
            .perform(get("/api/tts/voices").param("userId", "1").header("X-USER-TOKEN", "tkn").param("lang", "en"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.default").value("v1"))
            .andExpect(jsonPath("$.options[0].id").value("v1"));
    }

    /**
     * GET variant for sentence synthesis should redirect to the audio URL
     * provided by the service.
     */
    @Test
    void streamSentenceRedirectsToAudio() throws Exception {
        TtsResponse resp = new TtsResponse("http://audio/url", 800L, "mp3", false, "obj");
        when(ttsService.synthesizeSentence(eq(1L), anyString(), any(TtsRequest.class))).thenReturn(Optional.of(resp));
        doNothing().when(userService).validateToken(1L, "tkn");

        mockMvc
            .perform(
                get("/api/tts/sentence")
                    .param("userId", "1")
                    .param("text", "hello world")
                    .param("lang", "en")
                    .header("X-USER-TOKEN", "tkn")
            )
            .andExpect(status().isFound())
            .andExpect(header().string("Location", "http://audio/url"));
    }

    /**
     * Direct streaming endpoint should return raw audio data.
     */
    @Test
    void streamSentenceAudioReturnsBytes() throws Exception {
        TtsResponse resp = new TtsResponse("http://audio/url", 800L, "mp3", false, "obj");
        when(ttsService.synthesizeSentence(eq(1L), anyString(), any(TtsRequest.class))).thenReturn(Optional.of(resp));
        when(restTemplate.getForObject("http://audio/url", byte[].class)).thenReturn(
            "data".getBytes(StandardCharsets.UTF_8)
        );
        doNothing().when(userService).validateToken(1L, "tkn");

        mockMvc
            .perform(
                get("/api/tts/sentence/audio")
                    .param("userId", "1")
                    .param("text", "hello world")
                    .param("lang", "en")
                    .header("X-USER-TOKEN", "tkn")
            )
            .andExpect(status().isOk())
            .andExpect(content().bytes("data".getBytes(StandardCharsets.UTF_8)));
    }

    /**
     * Direct streaming endpoint for single word pronunciations should
     * return raw audio data without a redirect.
     */
    @Test
    void streamWordAudioReturnsBytes() throws Exception {
        TtsResponse resp = new TtsResponse("http://audio/word", 500L, "mp3", true, "obj");
        when(ttsService.synthesizeWord(eq(1L), anyString(), any(TtsRequest.class))).thenReturn(Optional.of(resp));
        when(restTemplate.getForObject("http://audio/word", byte[].class)).thenReturn(
            "data".getBytes(StandardCharsets.UTF_8)
        );
        doNothing().when(userService).validateToken(1L, "tkn");

        mockMvc
            .perform(
                get("/api/tts/word/audio")
                    .param("userId", "1")
                    .param("text", "hello")
                    .param("lang", "en")
                    .header("X-USER-TOKEN", "tkn")
            )
            .andExpect(status().isOk())
            .andExpect(content().bytes("data".getBytes(StandardCharsets.UTF_8)));
    }
}
