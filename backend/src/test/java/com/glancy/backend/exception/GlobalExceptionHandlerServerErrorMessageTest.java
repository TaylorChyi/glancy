/**
 * 背景：
 *  - 5xx 异常目前会透传后端异常详情，违反最小披露原则且影响用户体验。
 * 目的：
 *  - 通过集成测试验证全局异常处理器会在服务端异常时返回统一提示语，保障策略落地。
 * 关键决策与取舍：
 *  - 采用 MockMvcBuilders 构建轻量级独立容器，仅加载待测控制器与异常处理器，避免全应用上下文带来的安全拦截干扰。
 * 影响范围：
 *  - 该测试覆盖 503 服务降级场景，其验证逻辑适用于所有 5xx 策略。
 * 演进与TODO：
 *  - 后续可追加对 SSE、特定 5xx 状态的断言，以防策略回归。
 */
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
