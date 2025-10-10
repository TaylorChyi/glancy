package com.glancy.backend.controller;

import com.glancy.backend.dto.ChatRequest;
import com.glancy.backend.llm.llm.LLMClient;
import com.glancy.backend.llm.llm.LLMClientFactory;
import java.nio.charset.StandardCharsets;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.buffer.DataBuffer;
import org.springframework.core.io.buffer.DefaultDataBufferFactory;
import org.springframework.http.MediaType;
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

    private static final DefaultDataBufferFactory BUFFER_FACTORY = new DefaultDataBufferFactory();

    private final LLMClientFactory clientFactory;

    public ChatController(LLMClientFactory clientFactory) {
        this.clientFactory = clientFactory;
    }

    /**
     * 以 Server-Sent Events 方式流式返回模型响应。连接关闭或出现异常时，
     * 会记录日志并优雅结束输出。
     */
    @PostMapping(value = "/api/chat", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public Flux<DataBuffer> chat(@RequestBody ChatRequest request) {
        LLMClient client = clientFactory.get(request.getModel());
        if (client == null) {
            return Flux.error(new IllegalArgumentException("Unknown model: " + request.getModel()));
        }
        return client
            .streamChat(request.getMessages(), request.getTemperature())
            .map(chunk -> BUFFER_FACTORY.wrap(chunk.getBytes(StandardCharsets.UTF_8)))
            .doOnCancel(() -> log.info("SSE connection cancelled: model={}", request.getModel()))
            .doOnError(ex -> log.error("SSE streaming failed: model={}", request.getModel(), ex))
            .doFinally(signal -> log.info("SSE stream terminated: {}", signal));
    }
}
