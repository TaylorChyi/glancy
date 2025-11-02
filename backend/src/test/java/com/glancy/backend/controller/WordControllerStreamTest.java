package com.glancy.backend.controller;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.asyncDispatch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.request;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.glancy.backend.entity.DictionaryFlavor;
import com.glancy.backend.entity.Language;
import com.glancy.backend.exception.InvalidRequestException;
import com.glancy.backend.service.UserService;
import com.glancy.backend.service.WordService;
import java.nio.charset.StandardCharsets;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import reactor.core.publisher.Flux;

/**
 * {@link WordController} 流式接口的集成测试，覆盖业务异常与系统异常。
 */
@SpringBootTest(
    properties = {
        "oss.endpoint=https://oss-cn-hangzhou.aliyuncs.com",
        "oss.bucket=test-bucket",
        "oss.access-key-id=dummy",
        "oss.access-key-secret=dummy",
        "oss.verify-location=false",
    }
)
@AutoConfigureMockMvc
class WordControllerStreamTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private WordService wordService;

    @MockitoBean
    private UserService userService;

    /**
     * 场景：请求触发 {@link InvalidRequestException}。
     * 步骤：
     * 1. 模拟用户认证与服务端抛出业务异常。
     * 2. 触发 SSE 请求并完成异步调度。
     * 3. 断言状态码为 422，且返回的 SSE 负载符合全局异常格式。
     */
    @Test
    void streamWord_shouldRenderInvalidRequestAsSseError() throws Exception {
        when(userService.authenticateToken("tkn")).thenReturn(1L);
        when(
            wordService.streamWordForUser(
                eq(1L),
                eq("hello"),
                eq(Language.ENGLISH),
                eq(DictionaryFlavor.BILINGUAL),
                isNull(String.class),
                eq(false),
                eq(true)
            )
        ).thenReturn(Flux.error(new InvalidRequestException("参数不合法")));

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
            .andExpect(status().isUnprocessableEntity())
            .andExpect(header().string(HttpHeaders.CONTENT_TYPE, MediaType.TEXT_EVENT_STREAM_VALUE))
            .andReturn();

        String body = dispatched.getResponse().getContentAsString(StandardCharsets.UTF_8);
        assertEquals("event: error\ndata: {\"message\":\"参数不合法\"}\n\n", body);
    }

    /**
     * 场景：流式接口发生系统异常。
     * 步骤：
     * 1. 模拟用户认证并让服务抛出运行时异常。
     * 2. 触发 SSE 请求并完成异步调度。
     * 3. 断言响应为 500 且使用全局异常的 SSE 包装体。
     */
    @Test
    void streamWord_shouldWrapSystemErrorWithGlobalHandler() throws Exception {
        when(userService.authenticateToken("tkn")).thenReturn(1L);
        when(
            wordService.streamWordForUser(
                eq(1L),
                eq("hello"),
                eq(Language.ENGLISH),
                eq(DictionaryFlavor.BILINGUAL),
                isNull(String.class),
                eq(false),
                eq(true)
            )
        ).thenReturn(Flux.error(new IllegalStateException("unexpected")));

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
            .andExpect(header().string(HttpHeaders.CONTENT_TYPE, MediaType.TEXT_EVENT_STREAM_VALUE))
            .andReturn();

        String body = dispatched.getResponse().getContentAsString(StandardCharsets.UTF_8);
        assertEquals("event: error\ndata: {\"message\":\"内部服务器错误\"}\n\n", body);
    }
}
