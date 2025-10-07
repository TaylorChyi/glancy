package com.glancy.backend.exception;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * 测试全局异常处理在 SSE 请求下的返回。
 * 流程：
 * 1. 发送 Accept 为 text/event-stream 的请求。
 * 2. 控制器抛出 ResourceNotFoundException。
 * 3. 验证响应为 SSE 格式错误事件。
 */
class GlobalExceptionHandlerSseTest {

    private MockMvc mvc;

    @BeforeEach
    void setUp() {
        GlobalExceptionHandler handler = new GlobalExceptionHandler(
            new ObjectMapper(),
            HttpStatusAwareErrorMessageResolver.defaultResolver()
        );
        mvc = MockMvcBuilders.standaloneSetup(new DummyController())
            .setControllerAdvice(handler)
            .defaultRequest(get("/").accept(MediaType.APPLICATION_JSON))
            .build();
    }

    @RestController
    @RequestMapping("/dummy")
    public static class DummyController {

        @GetMapping("/boom")
        String boom() {
            throw new ResourceNotFoundException("missing");
        }
    }

    @Test
    void returnsSseErrorWhenAcceptEventStream() throws Exception {
        mvc
            .perform(get("/dummy/boom").accept(MediaType.TEXT_EVENT_STREAM))
            .andExpect(status().isNotFound())
            .andExpect(content().contentTypeCompatibleWith(MediaType.TEXT_EVENT_STREAM))
            .andExpect(content().string("event: error\ndata: {\"message\":\"missing\"}\n\n"));
    }
}
