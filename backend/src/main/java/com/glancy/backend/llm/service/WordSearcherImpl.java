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
import reactor.core.publisher.Flux;

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

    /**
     * 面向实时场景的搜索接口，直接返回模型的流式输出。
     */
    public Flux<String> streamSearch(String term, Language language, String clientName) {
        log.info("WordSearcher streaming for '{}' using client '{}'", term, clientName);
        String cleanInput = searchContentManager.normalize(term);
        log.info("Normalized input term='{}'", cleanInput);

        String prompt = promptManager.loadPrompt(config.getPromptPath());
        log.info(
            "Loaded prompt from path='{}', length='{}'",
            config.getPromptPath(),
            prompt != null ? prompt.length() : 0
        );

        String name = clientName != null ? clientName : config.getDefaultClient();
        LLMClient client = clientFactory.get(name);
        if (client == null) {
            log.warn("LLM client '{}' not found, falling back to default", name);
            client = clientFactory.get(config.getDefaultClient());
        }
        log.info("Using LLM client '{}'", name);

        List<ChatMessage> messages = new ArrayList<>();
        messages.add(new ChatMessage("system", prompt));
        messages.add(new ChatMessage("user", cleanInput));
        log.info("Using LLM client '{}'", name);
        log.info(
            "Prepared '{}' request messages: roles='{}'",
            messages.size(),
            messages.stream().map(ChatMessage::getRole).toList()
        );

        log.info("Sending streaming request to LLM client '{}' for term='{}'", name, term);
        return client.streamChat(messages, config.getTemperature());
    }
}
