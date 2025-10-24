package com.glancy.backend.controller;

import com.glancy.backend.dto.chat.ChatRequest;
import com.glancy.backend.llm.llm.LLMClient;
import com.glancy.backend.llm.llm.LLMClientFactory;
import com.glancy.backend.llm.model.ChatMessage;
import java.time.Duration;
import java.util.List;
import java.util.concurrent.atomic.AtomicLong;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.http.MediaType;
import org.springframework.http.codec.ServerSentEvent;
import org.springframework.test.web.reactive.server.FluxExchangeResult;
import org.springframework.test.web.reactive.server.WebTestClient;
import reactor.core.publisher.Flux;

/**
 * 集成测试：验证在持续输出场景下 SSE 通道的稳定性。
 *
 * <p>测试通过自定义的 {@link LLMClient} 模拟长时间的流式响应，并断言所有片段
 * 均被客户端完整接收。</p>
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class ChatControllerIT {

    private static final int STREAM_CHUNK_COUNT = 50;

    @Autowired
    private WebTestClient webTestClient;

    @TestConfiguration
    static class StubConfig {

        @Bean
        @org.springframework.context.annotation.Primary
        LLMClientFactory llmClientFactory() {
            LLMClient stub = new LLMClient() {
                @Override
                public Flux<String> streamChat(List<ChatMessage> messages, double temperature) {
                    // 通过按需生成的 Flux 保证严格遵循下游背压，避免 Interval 推送造成溢出。
                    return Flux.<String, AtomicLong>generate(AtomicLong::new, (counter, sink) -> {
                        long index = counter.getAndIncrement();
                        if (index >= STREAM_CHUNK_COUNT) {
                            sink.complete();
                        } else {
                            sink.next("chunk-" + index);
                        }
                        return counter;
                    }).delayElements(Duration.ofMillis(5));
                }

                @Override
                public String chat(List<ChatMessage> messages, double temperature) {
                    return "final-response";
                }

                @Override
                public String name() {
                    return "stub";
                }
            };
            return new LLMClientFactory(List.of(stub));
        }
    }

    /**
     * 测试目标：验证流式响应在长时间输出时遵循背压且完整结束。
     * 前置条件：
     *  - 使用 stub LLM 在 50 个片段内模拟 SSE 输出。
     * 步骤：
     *  1) 通过 WebTestClient 发起 stream 模式请求。
     *  2) 收集全部事件片段。
     * 断言：
     *  - 片段数为 50，且最后一个片段内容正确。
     * 边界/异常：
     *  - 验证订阅在背压约束下不会抛出 OverflowException。
     */
    @Test
    void streamChatShouldRemainStableForLongOutput() {
        ChatRequest req = new ChatRequest();
        req.setModel("stub");
        req.setMessages(List.of(new ChatMessage("user", "hello")));
        req.setResponseMode("stream");

        FluxExchangeResult<ServerSentEvent<String>> result = webTestClient
            .post()
            .uri("/api/chat")
            .contentType(MediaType.APPLICATION_JSON)
            .bodyValue(req)
            .exchange()
            .expectStatus()
            .isOk()
            .returnResult(new org.springframework.core.ParameterizedTypeReference<ServerSentEvent<String>>() {});

        List<String> chunks = result
            .getResponseBody()
            .map(ServerSentEvent::data)
            .collectList()
            .block(Duration.ofSeconds(10));

        org.junit.jupiter.api.Assertions.assertNotNull(chunks);
        org.junit.jupiter.api.Assertions.assertEquals(STREAM_CHUNK_COUNT, chunks.size());
        org.junit.jupiter.api.Assertions.assertEquals(
            "chunk-" + (STREAM_CHUNK_COUNT - 1),
            chunks.get(STREAM_CHUNK_COUNT - 1)
        );
    }

    /**
     * 测试目标：验证同步模式在显式声明时返回聚合响应体。
     * 前置条件：
     *  - 请求头 Accept: application/json。
     * 步骤：
     *  1) 构造显式 sync 模式的请求体。
     *  2) 发起接口调用并读取 JSON 响应。
     * 断言：
     *  - 响应状态为 200，且 content 字段等于 final-response。
     * 边界/异常：
     *  - 验证不会因 Accept 头导致模式误判。
     */
    @Test
    void chatSyncShouldReturnAggregatedResponse() {
        ChatRequest req = new ChatRequest();
        req.setModel("stub");
        req.setMessages(List.of(new ChatMessage("user", "hi")));
        req.setResponseMode("sync");

        webTestClient
            .post()
            .uri("/api/chat")
            .contentType(MediaType.APPLICATION_JSON)
            .accept(MediaType.APPLICATION_JSON)
            .bodyValue(req)
            .exchange()
            .expectStatus()
            .isOk()
            .expectBody()
            .jsonPath("$.content")
            .isEqualTo("final-response");
    }

    /**
     * 测试目标：验证显式响应模式优先级高于 Accept 头配置。
     * 前置条件：
     *  - 请求体声明 responseMode=sync，头部 Accept: text/event-stream。
     * 步骤：
     *  1) 构造冲突的模式请求。
     *  2) 触发接口并检查响应头与内容。
     * 断言：
     *  - 响应 Content-Type 仍为 application/json 且内容聚合。
     * 边界/异常：
     *  - 防止代理添加 Accept 头时造成模式漂移。
     */
    @Test
    void explicitSyncModeOverridesAcceptHeader() {
        ChatRequest req = new ChatRequest();
        req.setModel("stub");
        req.setMessages(List.of(new ChatMessage("user", "hi")));
        req.setResponseMode("sync");

        webTestClient
            .post()
            .uri("/api/chat")
            .contentType(MediaType.APPLICATION_JSON)
            .accept(MediaType.TEXT_EVENT_STREAM)
            .bodyValue(req)
            .exchange()
            .expectStatus()
            .isOk()
            .expectHeader()
            .contentType(MediaType.APPLICATION_JSON)
            .expectBody()
            .jsonPath("$.content")
            .isEqualTo("final-response");
    }
}
