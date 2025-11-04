package com.glancy.backend.controller;

import static org.hamcrest.Matchers.containsString;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.asyncDispatch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.request;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.glancy.backend.entity.Language;
import com.glancy.backend.service.UserService;
import com.glancy.backend.service.WordService;
import com.glancy.backend.service.word.WordStreamPayload;
import java.nio.charset.StandardCharsets;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import reactor.core.publisher.Flux;

/**
 * 流式单词查询接口测试。
 * 流程：
 * 1. 模拟用户认证。
 * 2. 模拟 WordService 返回两段数据。
 * 3. 发送请求并验证 SSE 响应序列。
 */
@WebMvcTest(controllers = WordController.class)
@Import(
    {
        com.glancy.backend.config.security.SecurityConfig.class,
        com.glancy.backend.config.WebConfig.class,
        com.glancy.backend.config.auth.AuthenticatedUserArgumentResolver.class,
    }
)
class WordControllerStreamingTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private WordService wordService;

    @MockitoBean
    private UserService userService;

    @Test
    void testStreamWord() throws Exception {
        when(
            wordService.streamWordForUser(
                eq(1L),
                eq("hello"),
                eq(Language.ENGLISH),
                eq(com.glancy.backend.entity.DictionaryFlavor.BILINGUAL),
                isNull(String.class),
                eq(false),
                eq(true)
            )
        ).thenReturn(Flux.just(WordStreamPayload.data("part1"), WordStreamPayload.version("77")));
        when(userService.authenticateToken("tkn")).thenReturn(1L);

        MvcResult result = mockMvc
            .perform(
                get("/api/words/stream")
                    .header("X-USER-TOKEN", "tkn")
                    .param("term", "hello")
                    .param("language", "ENGLISH")
                    .accept(MediaType.TEXT_EVENT_STREAM)
            )
            .andExpect(request().asyncStarted())
            .andReturn();

        mockMvc
            .perform(asyncDispatch(result))
            .andExpect(status().isOk())
            .andExpect(content().string(containsString("data:part1")))
            .andExpect(content().string(containsString("event:version")))
            .andExpect(content().string(containsString("data:77")));
    }

    /**
     * 测试流式接口在服务抛出错误时能够触发全局异常处理并输出 SSE 错误。
     */
    @Test
    void testStreamWordError() throws Exception {
        when(
            wordService.streamWordForUser(
                eq(1L),
                eq("hello"),
                eq(Language.ENGLISH),
                eq(com.glancy.backend.entity.DictionaryFlavor.BILINGUAL),
                isNull(String.class),
                eq(false),
                eq(true)
            )
        ).thenReturn(Flux.error(new IllegalStateException("boom")));
        when(userService.authenticateToken("tkn")).thenReturn(1L);

        MvcResult result = mockMvc
            .perform(
                get("/api/words/stream")
                    .header("X-USER-TOKEN", "tkn")
                    .param("term", "hello")
                    .param("language", "ENGLISH")
                    .accept(MediaType.TEXT_EVENT_STREAM)
            )
            .andExpect(request().asyncStarted())
            .andReturn();

        MvcResult dispatched = mockMvc
            .perform(asyncDispatch(result))
            .andExpect(status().isInternalServerError())
            .andExpect(header().string("Content-Type", MediaType.TEXT_EVENT_STREAM_VALUE))
            .andReturn();

        String body = dispatched.getResponse().getContentAsString(StandardCharsets.UTF_8);
        assertEquals("event: error\ndata: {\"message\":\"内部服务器错误\"}\n\n", body);
    }
}
