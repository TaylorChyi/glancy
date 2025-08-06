package com.glancy.backend.llm.llm;

import com.glancy.backend.llm.model.ChatMessage;
import java.util.List;

public interface LLMClient {
    String chat(List<ChatMessage> messages, double temperature);
    String name();
}
