package com.glancy.backend.llm.llm;

import com.glancy.backend.llm.model.ChatMessage;
import java.util.List;
import reactor.core.publisher.Flux;

public interface LLMClient {
    String chat(List<ChatMessage> messages, double temperature);

    default Flux<String> streamChat(List<ChatMessage> messages) {
        return Flux.just(chat(messages, 0.7));
    }

    String name();
}
