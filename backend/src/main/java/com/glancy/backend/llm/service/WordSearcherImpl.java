package com.glancy.backend.llm.service;

import com.glancy.backend.dto.WordResponse;
import com.glancy.backend.entity.Language;
import com.glancy.backend.llm.config.LLMConfig;
import com.glancy.backend.llm.llm.LLMClient;
import com.glancy.backend.llm.llm.LLMClientFactory;
import com.glancy.backend.llm.model.ChatMessage;
import com.glancy.backend.llm.parser.WordResponseParser;
import com.glancy.backend.llm.prompt.PromptManager;
import com.glancy.backend.llm.search.SearchContentManager;
import java.util.ArrayList;
import java.util.List;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Slf4j
@Service
public class WordSearcherImpl implements WordSearcher {

    private final LLMClientFactory clientFactory;
    private final LLMConfig config;
    private final PromptManager promptManager;
    private final SearchContentManager searchContentManager;
    private final WordResponseParser parser;

    public WordSearcherImpl(
        LLMClientFactory clientFactory,
        LLMConfig config,
        PromptManager promptManager,
        SearchContentManager searchContentManager,
        WordResponseParser parser
    ) {
        this.clientFactory = clientFactory;
        this.config = config;
        this.promptManager = promptManager;
        this.searchContentManager = searchContentManager;
        this.parser = parser;
    }

    @Override
    public WordResponse search(String term, Language language, String clientName) {
        log.info("WordSearcher searching for '{}' using client {}", term, clientName);
        String cleanInput = searchContentManager.normalize(term);
        String prompt = promptManager.loadPrompt(config.getPromptPath());
        String name = clientName != null ? clientName : config.getDefaultClient();
        LLMClient client = clientFactory.get(name);
        if (client == null) {
            log.warn("LLM client '{}' not found, falling back to default", name);
            String fallback = config.getDefaultClient();
            client = clientFactory.get(fallback);
            if (client == null) {
                throw new IllegalStateException(
                    String.format("LLM client '%s' not available and default '%s' not configured", name, fallback)
                );
            }
            name = fallback;
        }
        List<ChatMessage> messages = new ArrayList<>();
        messages.add(new ChatMessage("system", prompt));
        messages.add(new ChatMessage("user", cleanInput));
        String content = client.chat(messages, config.getTemperature());
        log.info("LLM client '{}' returned content: {}", name, content);
        return parser.parse(content, term, language);
    }
}
