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

class GlobalExceptionHandlerServerErrorMessageTest {

    private MockMvc mvc;

    @RestController
    @RequestMapping("/unstable")
    public static class UnstableController {

        @GetMapping("/503")
        String boom() {
            throw new ServiceDegradedException("upstream provider timeout");
        }
    }

    @BeforeEach
    void setUp() {
        GlobalExceptionHandler handler = new GlobalExceptionHandler(
            new ObjectMapper(),
            HttpStatusAwareErrorMessageResolver.defaultResolver()
        );
        mvc = MockMvcBuilders.standaloneSetup(new UnstableController())
            .setControllerAdvice(handler)
            .defaultRequest(get("/").accept(MediaType.APPLICATION_JSON))
            .build();
    }

    /**
     * 测试目标：确认 5xx 响应的错误消息会被统一替换为泛化提示，避免暴露内部细节。
     * 前置条件：Mock 控制器在访问 /unstable/503 时抛出 ServiceDegradedException，触发 503。
     * 步骤：
     *  1) 发送 GET /unstable/503 请求，接受 JSON。
     *  2) 由全局异常处理器生成响应。
     * 断言：
     *  - HTTP 状态码为 503。
     *  - 响应体 message 字段为统一提示语 "服务暂不可用，请稍后重试"。
     * 边界/异常：
     *  - 若策略未生效导致 message 泄露原始文案，断言失败并暴露问题。
     */
    @Test
    void GivenServerError_WhenHandled_ThenReturnGenericMessage() throws Exception {
        mvc
            .perform(get("/unstable/503").accept(MediaType.APPLICATION_JSON))
            .andExpect(status().isServiceUnavailable())
            .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
            .andExpect(jsonPath("$.message").value("服务暂不可用，请稍后重试"));
    }
}
