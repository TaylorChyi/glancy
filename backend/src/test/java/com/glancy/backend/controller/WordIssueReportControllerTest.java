package com.glancy.backend.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.glancy.backend.dto.WordIssueReportRequest;
import com.glancy.backend.dto.WordIssueReportResponse;
import com.glancy.backend.entity.DictionaryFlavor;
import com.glancy.backend.entity.Language;
import com.glancy.backend.entity.WordIssueCategory;
import com.glancy.backend.service.UserService;
import com.glancy.backend.service.WordIssueReportService;
import java.time.LocalDateTime;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;

@WebMvcTest(WordIssueReportController.class)
@Import({
    com.glancy.backend.config.security.SecurityConfig.class,
    com.glancy.backend.config.WebConfig.class,
    com.glancy.backend.config.auth.AuthenticatedUserArgumentResolver.class,
})
class WordIssueReportControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private WordIssueReportService wordIssueReportService;

    @MockitoBean
    private UserService userService;

    @BeforeEach
    void mockAuth() {
        when(userService.authenticateToken("token")).thenReturn(9L);
    }

    @Test
    void whenCreatingReport_thenStatusIsCreated() throws Exception {
        performCreateReport().andExpect(status().isCreated());
    }

    @Test
    void whenCreatingReport_thenResponseBodyContainsId() throws Exception {
        performCreateReport().andExpect(jsonPath("$.id").value(42));
    }

    private ResultActions performCreateReport() throws Exception {
        when(wordIssueReportService.registerReport(any(Long.class), any(WordIssueReportRequest.class)))
                .thenReturn(sampleResponse());
        return mockMvc.perform(post("/api/word-reports")
                .header("X-USER-TOKEN", "token")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(sampleRequest())));
    }

    private WordIssueReportResponse sampleResponse() {
        return new WordIssueReportResponse(
                42L,
                "hello",
                Language.ENGLISH,
                DictionaryFlavor.BILINGUAL,
                WordIssueCategory.MISSING_INFORMATION,
                null,
                null,
                LocalDateTime.now());
    }

    private WordIssueReportRequest sampleRequest() {
        return new WordIssueReportRequest(
                "hello",
                Language.ENGLISH,
                DictionaryFlavor.BILINGUAL,
                WordIssueCategory.MISSING_INFORMATION,
                null,
                null);
    }
}
