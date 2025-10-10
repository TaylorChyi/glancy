package com.glancy.backend.controller;

import com.glancy.backend.dto.ChatRequest;
import com.glancy.backend.llm.llm.LLMClient;
import com.glancy.backend.llm.llm.LLMClientFactory;
import com.glancy.backend.llm.model.ChatMessage;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.core.io.buffer.DataBuffer;
import org.springframework.core.io.buffer.DataBufferUtils;
import org.springframework.http.MediaType;
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

    @Autowired
    private WebTestClient webTestClient;

    @TestConfiguration
    static class StubConfig {

        @Bean
        LLMClientFactory llmClientFactory() {
            LLMClient stub = new LLMClient() {
                @Override
                public Flux<String> streamChat(List<ChatMessage> messages, double temperature) {
                    return Flux.interval(Duration.ofMillis(5))
                        .map(i -> String.format("event: message%ndata: chunk-%d%n%n", i))
                        .take(50);
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
     * 长时间流式输出应保持稳定并最终完整关闭连接。
     */
    @Test
    void streamChatShouldRemainStableForLongOutput() {
        ChatRequest req = new ChatRequest();
        req.setModel("stub");
        req.setMessages(List.of(new ChatMessage("user", "hello")));

        FluxExchangeResult<DataBuffer> result = webTestClient
            .post()
            .uri("/api/chat")
            .contentType(MediaType.APPLICATION_JSON)
            .bodyValue(req)
            .exchange()
            .expectStatus()
            .isOk()
            .returnResult(DataBuffer.class);

        List<String> chunks = result.getResponseBody().map(this::toUtf8).collectList().block(Duration.ofSeconds(10));

        org.junit.jupiter.api.Assertions.assertNotNull(chunks);
        org.junit.jupiter.api.Assertions.assertEquals(50, chunks.size());
        org.junit.jupiter.api.Assertions.assertTrue(chunks.get(49).contains("chunk-49"));
    }

    private String toUtf8(DataBuffer buffer) {
        byte[] bytes = new byte[buffer.readableByteCount()];
        buffer.read(bytes);
        DataBufferUtils.release(buffer);
        return new String(bytes, StandardCharsets.UTF_8);
    }
}
