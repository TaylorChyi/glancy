package com.glancy.backend.llm.llm;

import com.glancy.backend.llm.model.ChatMessage;
import java.util.List;
import reactor.core.publisher.Flux;

public interface StreamingLLMClient {
    Flux<String> streamChat(List<ChatMessage> messages, double temperature);
    String name();
}
