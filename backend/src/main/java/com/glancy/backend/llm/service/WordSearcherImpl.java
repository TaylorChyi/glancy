package com.glancy.backend.llm.service;

import com.glancy.backend.dto.WordPersonalizationContext;
import com.glancy.backend.dto.WordResponse;
import com.glancy.backend.entity.DictionaryFlavor;
import com.glancy.backend.entity.Language;
import com.glancy.backend.llm.completion.CompletionSentinel;
import com.glancy.backend.llm.completion.CompletionSentinel.CompletionCheck;
import com.glancy.backend.llm.config.LLMConfig;
import com.glancy.backend.llm.llm.DictionaryModelClient;
import com.glancy.backend.llm.llm.DictionaryModelClientFactory;
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

    private final DictionaryModelClientFactory clientFactory;
    private final LLMConfig config;
    private final PromptManager promptManager;
    private final SearchContentManager searchContentManager;
    private final WordResponseParser parser;
    private final WordPromptAssembler promptAssembler;

    public WordSearcherImpl(
        DictionaryModelClientFactory clientFactory,
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
            "WordSearcher searching for '{}' using dictionary client {} " +
            "language={} flavor={} personalizationSignals={}",
            term,
            clientName,
            language,
            flavor,
            personalizationContext != null && personalizationContext.hasSignals()
        );
        SearchInputs inputs = buildSearchInputs(term, language, flavor, clientName);
        DictionaryModelClient client = resolveClient(inputs.clientName());
        List<ChatMessage> messages = promptAssembler.composeMessages(
            inputs.prompt(),
            inputs.cleanInput(),
            personalizationContext,
            language,
            flavor
        );
        String content = client.generateEntry(messages, config.getTemperature());
        CompletionCheck completion = inspectCompletion(inputs.clientName(), content);
        ParsedWord parsed = parser.parse(sanitizedContent(content, completion), term, language);
        return parsed.parsed();
    }

    private SearchInputs buildSearchInputs(String term, Language language, DictionaryFlavor flavor, String clientName) {
        String cleanInput = searchContentManager.normalize(term);
        String promptPath = config.resolvePromptPath(language, flavor);
        String prompt = promptManager.loadPrompt(promptPath);
        String resolvedClientName = clientName != null ? clientName : config.getDefaultClient();
        return new SearchInputs(cleanInput, prompt, resolvedClientName);
    }

    private CompletionCheck inspectCompletion(String resolvedClientName, String content) {
        CompletionCheck completion = CompletionSentinel.inspect(content);
        log.info(
            "Dictionary model client '{}' returned content (sentinelPresent={}): {}",
            resolvedClientName,
            completion.satisfied(),
            content
        );
        if (!completion.satisfied()) {
            log.warn(
                "Dictionary model client '{}' response missing completion sentinel '{}'",
                resolvedClientName,
                CompletionSentinel.MARKER
            );
        }
        return completion;
    }

    private String sanitizedContent(String content, CompletionCheck completion) {
        return completion.sanitizedContent() != null ? completion.sanitizedContent() : content;
    }

    private DictionaryModelClient resolveClient(String clientName) {
        DictionaryModelClient client = clientFactory.get(clientName);
        if (client != null) {
            return client;
        }
        log.warn("Dictionary model client '{}' not found, falling back to default", clientName);
        String fallback = config.getDefaultClient();
        DictionaryModelClient fallbackClient = clientFactory.get(fallback);
        if (fallbackClient == null) {
            throw new IllegalStateException(
                String.format(
                    "Dictionary model client '%s' not available and default '%s' not configured",
                    clientName,
                    fallback
                )
            );
        }
        return fallbackClient;
    }

    private record SearchInputs(String cleanInput, String prompt, String clientName) {}
}
