package com.glancy.backend.llm.service;

import com.glancy.backend.dto.WordPersonalizationContext;
import com.glancy.backend.dto.WordResponse;
import com.glancy.backend.entity.DictionaryFlavor;
import com.glancy.backend.entity.Language;
import com.glancy.backend.llm.completion.CompletionSentinel;
import com.glancy.backend.llm.completion.CompletionSentinel.CompletionCheck;
import com.glancy.backend.llm.config.LLMConfig;
import com.glancy.backend.llm.llm.LLMClient;
import com.glancy.backend.llm.llm.LLMClientFactory;
import com.glancy.backend.llm.model.ChatMessage;
import com.glancy.backend.llm.parser.ParsedWord;
import com.glancy.backend.llm.parser.WordResponseParser;
import com.glancy.backend.llm.prompt.PromptManager;
import com.glancy.backend.llm.search.SearchContentManager;
import java.util.List;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

/**
 * 背景：
 *  - 词典检索从流式模式迁移到同步调用后，原始实现内联了 Prompt 拼装细节导致类体量超限。
 * 目的：
 *  - 通过委托 {@link WordPromptAssembler} 专注于消息构造，让搜索编排聚焦模型选择与结果解析。
 * 关键决策与取舍：
 *  - 采用组合而非继承来复用 Prompt 逻辑，避免引入复杂的模板层次，同时满足 250 行以内约束。
 *  - 将 tone、画像指令等策略下放到可独立测试的组件，为后续扩展多语言策略预留接口。
 * 影响范围：
 *  - 依赖该搜索器的 controller 与服务保持不变；新增组件需要在 Spring 上下文注册。
 * 演进与TODO：
 *  - 后续可引入特性开关以支持不同 Prompt 版本动态选择。
 */
@Slf4j
@Service
public class WordSearcherImpl implements WordSearcher {

    private final LLMClientFactory clientFactory;
    private final LLMConfig config;
    private final PromptManager promptManager;
    private final SearchContentManager searchContentManager;
    private final WordResponseParser parser;
    private final WordPromptAssembler promptAssembler;

    public WordSearcherImpl(
        LLMClientFactory clientFactory,
        LLMConfig config,
        PromptManager promptManager,
        SearchContentManager searchContentManager,
        WordResponseParser parser,
        WordPromptAssembler promptAssembler
    ) {
        this.clientFactory = clientFactory;
        this.config = config;
        this.promptManager = promptManager;
        this.searchContentManager = searchContentManager;
        this.parser = parser;
        this.promptAssembler = promptAssembler;
    }

    @Override
    public WordResponse search(
        String term,
        Language language,
        DictionaryFlavor flavor,
        String clientName,
        WordPersonalizationContext personalizationContext
    ) {
        log.info(
            "WordSearcher searching for '{}' using client {} language={} flavor={} personalizationSignals={}",
            term,
            clientName,
            language,
            flavor,
            personalizationContext != null && personalizationContext.hasSignals()
        );
        String cleanInput = searchContentManager.normalize(term);
        String promptPath = config.resolvePromptPath(language, flavor);
        String prompt = promptManager.loadPrompt(promptPath);
        String resolvedClientName = clientName != null ? clientName : config.getDefaultClient();
        LLMClient client = resolveClient(resolvedClientName);
        List<ChatMessage> messages = promptAssembler.composeMessages(
            prompt,
            cleanInput,
            personalizationContext,
            language,
            flavor
        );
        String content = client.chat(messages, config.getTemperature());
        CompletionCheck completion = CompletionSentinel.inspect(content);
        log.info(
            "LLM client '{}' returned content (sentinelPresent={}): {}",
            resolvedClientName,
            completion.satisfied(),
            content
        );
        if (!completion.satisfied()) {
            log.warn(
                "LLM client '{}' response missing completion sentinel '{}'",
                resolvedClientName,
                CompletionSentinel.MARKER
            );
        }
        String sanitized = completion.sanitizedContent() != null ? completion.sanitizedContent() : content;
        ParsedWord parsed = parser.parse(sanitized, term, language);
        return parsed.parsed();
    }

    private LLMClient resolveClient(String clientName) {
        LLMClient client = clientFactory.get(clientName);
        if (client != null) {
            return client;
        }
        log.warn("LLM client '{}' not found, falling back to default", clientName);
        String fallback = config.getDefaultClient();
        LLMClient fallbackClient = clientFactory.get(fallback);
        if (fallbackClient == null) {
            throw new IllegalStateException(
                String.format("LLM client '%s' not available and default '%s' not configured", clientName, fallback)
            );
        }
        return fallbackClient;
    }
}
