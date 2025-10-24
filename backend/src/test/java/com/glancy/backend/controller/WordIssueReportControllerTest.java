package com.glancy.backend.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.glancy.backend.dto.word.WordIssueReportRequest;
import com.glancy.backend.dto.word.WordIssueReportResponse;
import com.glancy.backend.entity.DictionaryFlavor;
import com.glancy.backend.entity.Language;
import com.glancy.backend.entity.WordIssueCategory;
import com.glancy.backend.service.UserService;
import com.glancy.backend.service.WordIssueReportService;
import java.time.LocalDateTime;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(WordIssueReportController.class)
@Import(
    {
        com.glancy.backend.config.security.SecurityConfig.class,
        com.glancy.backend.config.WebConfig.class,
        com.glancy.backend.config.auth.AuthenticatedUserArgumentResolver.class,
    }
)
class WordIssueReportControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private WordIssueReportService wordIssueReportService;

    @MockitoBean
    private UserService userService;

    /**
     * 测试目标：认证通过的用户提交举报时返回 201，并包含生成的主键。
     * 前置条件：mock UserService 令 token 对应 userId，mock service 返回固定响应。
     * 步骤：
     *  1) 构造请求体并携带 X-USER-TOKEN；
     *  2) 调用 /api/word-reports。
     * 断言：
     *  - 状态码为 201；
     *  - 响应体 id 字段等于预期值。
     * 边界/异常：
     *  - 未带 token 时会被拦截（此用例未覆盖）。
     */
    @Test
    void createReport_returnsCreated() throws Exception {
        WordIssueReportResponse response = new WordIssueReportResponse(
            42L,
            "hello",
            Language.ENGLISH,
            DictionaryFlavor.BILINGUAL,
            WordIssueCategory.MISSING_INFORMATION,
            null,
            null,
            LocalDateTime.now()
        );
        when(userService.authenticateToken("token")).thenReturn(9L);
        when(wordIssueReportService.registerReport(any(Long.class), any(WordIssueReportRequest.class))).thenReturn(
            response
        );

        WordIssueReportRequest request = new WordIssueReportRequest(
            "hello",
            Language.ENGLISH,
            DictionaryFlavor.BILINGUAL,
            WordIssueCategory.MISSING_INFORMATION,
            null,
            null
        );

        mockMvc
            .perform(
                post("/api/word-reports")
                    .header("X-USER-TOKEN", "token")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request))
            )
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.id").value(42));
    }
}
