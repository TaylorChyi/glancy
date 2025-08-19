package com.glancy.backend.controller;

import com.glancy.backend.llm.llm.LLMClientFactory;
import com.glancy.backend.llm.model.ChatMessage;
import java.util.List;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.http.codec.ServerSentEvent;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Flux;

/**
 * Streams chat completions to the client using Server-Sent Events.
 */
@Slf4j
@RestController
public class ChatController {

    private final LLMClientFactory llmClientFactory;

    public ChatController(LLMClientFactory llmClientFactory) {
        this.llmClientFactory = llmClientFactory;
    }

    @PostMapping(value = "/api/chat", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public Flux<ServerSentEvent<String>> chat(@RequestBody ChatRequest request) {
        return llmClientFactory
            .streamChat(request.model(), request.messages())
            .map(chunk -> ServerSentEvent.builder(chunk).build())
            .doOnCancel(() -> log.info("Client disconnected from chat stream"))
            .doOnError(e -> log.error("Chat stream error", e))
            .doFinally(signal -> log.info("Chat stream completed with signal: {}", signal));
    }

    public record ChatRequest(String model, List<ChatMessage> messages) {}
}
