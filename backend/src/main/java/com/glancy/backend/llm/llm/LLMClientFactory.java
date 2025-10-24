package com.glancy.backend.llm.llm;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Component;

@Component
public class LLMClientFactory {

    private final Map<String, LLMClient> clientMap = new HashMap<>();

    public LLMClientFactory(List<LLMClient> clients) {
        for (LLMClient client : clients) {
            clientMap.put(client.name(), client);
        }
    }

    public LLMClient get(String name) {
        return clientMap.get(name);
    }
}
