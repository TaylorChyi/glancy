package com.glancy.backend.controller;

import com.glancy.backend.dto.ChatRequest;
import com.glancy.backend.llm.llm.LLMClient;
import com.glancy.backend.llm.llm.LLMClientFactory;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.http.codec.ServerSentEvent;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Flux;

/**
 * 提供与大语言模型进行流式对话的接口。
 */
@RestController
@Slf4j
public class ChatController {

    private final LLMClientFactory clientFactory;

    public ChatController(LLMClientFactory clientFactory) {
        this.clientFactory = clientFactory;
    }

    /**
     * 以 Server-Sent Events 方式流式返回模型响应。连接关闭或出现异常时，
     * 会记录日志并优雅结束输出。
     */
    @PostMapping(value = "/api/chat", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public Flux<ServerSentEvent<String>> chat(@RequestBody ChatRequest request) {
        LLMClient client = clientFactory.get(request.getModel());
        if (client == null) {
            return Flux.error(new IllegalArgumentException("Unknown model: " + request.getModel()));
        }
        return client
            .streamChat(request.getMessages(), request.getTemperature())
            .map(data -> ServerSentEvent.builder(data).build())
            .doOnCancel(() -> log.info("SSE connection cancelled: model={}", request.getModel()))
            .onErrorResume(
                ex -> {
                    log.error("SSE streaming failed: model={}", request.getModel(), ex);
                    return Flux.just(ServerSentEvent.builder("[ERROR] stream terminated").event("error").build());
                }
            )
            .doFinally(signal -> log.info("SSE stream terminated: {}", signal));
    }
}
