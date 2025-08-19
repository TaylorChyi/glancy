package com.glancy.backend.controller;

import com.glancy.backend.llm.llm.LLMClient;
import com.glancy.backend.llm.model.ChatMessage;
import java.time.Duration;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.reactive.AutoConfigureWebTestClient;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.reactive.server.FluxExchangeResult;
import org.springframework.test.web.reactive.server.WebTestClient;
import reactor.core.publisher.Flux;
import reactor.test.StepVerifier;

@SpringBootTest
@AutoConfigureWebTestClient
class ChatControllerSseIT {

    @Autowired
    private WebTestClient webTestClient;

    @MockitoBean
    private com.glancy.backend.service.UserService userService;

    @Configuration
    static class TestConfig {
        @Bean
        LLMClient mockClient() {
            return new LLMClient() {
                @Override
                public String chat(List<ChatMessage> messages, double temperature) {
                    return "unused";
                }

                @Override
                public Flux<String> streamChat(List<ChatMessage> messages) {
                    return Flux.interval(Duration.ofMillis(50)).map(i -> "part-" + i).take(5);
                }

                @Override
                public String name() {
                    return "mock";
                }
            };
        }
    }

    /**
     * 验证在长时间流式输出过程中，SSE 通道能够持续发送数据并最终正常结束。
     */
    @Test
    void streamChatSendsMultipleChunks() {
        ChatController.ChatRequest req = new ChatController.ChatRequest(
            "mock",
            List.of(new ChatMessage("user", "hi"))
        );

        FluxExchangeResult<String> result = webTestClient
            .post()
            .uri("/api/chat")
            .bodyValue(req)
            .exchange()
            .expectStatus()
            .isOk()
            .returnResult(String.class);

        StepVerifier
            .create(result.getResponseBody())
            .expectNext("part-0", "part-1", "part-2", "part-3", "part-4")
            .expectComplete()
            .verify();
    }
}
