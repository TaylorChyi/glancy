package com.glancy.backend.llm.service;

import com.glancy.backend.dto.WordPersonalizationContext;
import com.glancy.backend.dto.WordResponse;
import com.glancy.backend.entity.Language;
import com.glancy.backend.llm.config.LLMConfig;
import com.glancy.backend.llm.llm.LLMClient;
import com.glancy.backend.llm.llm.LLMClientFactory;
import com.glancy.backend.llm.model.ChatMessage;
import com.glancy.backend.llm.parser.ParsedWord;
import com.glancy.backend.llm.parser.WordResponseParser;
import com.glancy.backend.llm.prompt.PromptManager;
import com.glancy.backend.llm.search.SearchContentManager;
import com.glancy.backend.llm.stream.CompletionSentinel;
import com.glancy.backend.llm.stream.CompletionSentinel.CompletionCheck;
import java.util.ArrayList;
import java.util.List;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
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
    public WordResponse search(
        String term,
        Language language,
        String clientName,
        WordPersonalizationContext personalizationContext
    ) {
        log.info(
            "WordSearcher searching for '{}' using client {} personalizationSignals={}",
            term,
            clientName,
            personalizationContext != null && personalizationContext.hasSignals()
        );
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
        List<ChatMessage> messages = buildMessages(prompt, cleanInput, personalizationContext);
        String content = client.chat(messages, config.getTemperature());
        CompletionCheck completion = CompletionSentinel.inspect(content);
        log.info("LLM client '{}' returned content (sentinelPresent={}): {}", name, completion.satisfied(), content);
        if (!completion.satisfied()) {
            log.warn("LLM client '{}' response missing completion sentinel '{}'", name, CompletionSentinel.MARKER);
        }
        String sanitized = completion.sanitizedContent() != null ? completion.sanitizedContent() : content;
        ParsedWord parsed = parser.parse(sanitized, term, language);
        return parsed.parsed();
    }

    /**
     * 面向实时场景的搜索接口，直接返回模型的流式输出。
     */
    public Flux<String> streamSearch(
        String term,
        Language language,
        String clientName,
        WordPersonalizationContext personalizationContext
    ) {
        log.info(
            "WordSearcher streaming for '{}' using client '{}' personalizationSignals={}",
            term,
            clientName,
            personalizationContext != null && personalizationContext.hasSignals()
        );
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

        List<ChatMessage> messages = buildMessages(prompt, cleanInput, personalizationContext);
        log.info("Using LLM client '{}'", name);
        log.info(
            "Prepared '{}' request messages: roles='{}'",
            messages.size(),
            messages.stream().map(ChatMessage::getRole).toList()
        );

        log.info("Sending streaming request to LLM client '{}' for term='{}'", name, term);
        return client.streamChat(messages, config.getTemperature());
    }

    private List<ChatMessage> buildMessages(
        String prompt,
        String cleanInput,
        WordPersonalizationContext personalizationContext
    ) {
        List<ChatMessage> messages = new ArrayList<>();
        messages.add(new ChatMessage("system", prompt));
        String personaInstruction = renderPersonaInstruction(personalizationContext);
        if (personaInstruction != null) {
            messages.add(new ChatMessage("system", personaInstruction));
        }
        messages.add(new ChatMessage("user", renderUserPayload(cleanInput, personalizationContext)));
        return messages;
    }

    private String renderPersonaInstruction(WordPersonalizationContext personalizationContext) {
        if (personalizationContext == null || !personalizationContext.hasSignals()) {
            return null;
        }
        StringBuilder builder = new StringBuilder();
        builder
            .append("你正在为")
            .append(personalizationContext.personaDescriptor())
            .append("提供词汇讲解");
        if (StringUtils.hasText(personalizationContext.preferredTone())) {
            builder.append("，请保持").append(personalizationContext.preferredTone()).append("的语气");
        }
        if (StringUtils.hasText(personalizationContext.goal())) {
            builder.append("，学习目标是").append(personalizationContext.goal());
        }
        if (!personalizationContext.interests().isEmpty()) {
            builder.append("，关注领域包含").append(String.join("、", personalizationContext.interests()));
        }
        builder.append("。");
        return builder.toString();
    }

    private String renderUserPayload(String cleanInput, WordPersonalizationContext personalizationContext) {
        StringBuilder builder = new StringBuilder("查询词汇：").append(cleanInput);
        if (personalizationContext != null && personalizationContext.hasSignals()) {
            if (!personalizationContext.recentTerms().isEmpty()) {
                builder
                    .append("\n近期检索：")
                    .append(String.join("、", personalizationContext.recentTerms()));
            }
            if (StringUtils.hasText(personalizationContext.goal())) {
                builder.append("\n学习目标：").append(personalizationContext.goal());
            }
            builder.append("\n请结合画像输出结构化释义、语义差异与可执行练习建议。");
        } else {
            builder.append("\n请输出结构化释义、用法说明与示例。");
        }
        return builder.toString();
    }
}
