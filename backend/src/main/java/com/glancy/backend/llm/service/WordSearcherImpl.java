package com.glancy.backend.llm.service;

import com.glancy.backend.dto.WordPersonalizationContext;
import com.glancy.backend.dto.WordResponse;
import com.glancy.backend.entity.DictionaryFlavor;
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
        List<ChatMessage> messages = buildMessages(prompt, cleanInput, personalizationContext, language, flavor);
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
        DictionaryFlavor flavor,
        String clientName,
        WordPersonalizationContext personalizationContext
    ) {
        log.info(
            "WordSearcher streaming for '{}' using client '{}' language={} flavor={} personalizationSignals={}",
            term,
            clientName,
            language,
            flavor,
            personalizationContext != null && personalizationContext.hasSignals()
        );
        String cleanInput = searchContentManager.normalize(term);
        log.info("Normalized input term='{}'", cleanInput);

        String promptPath = config.resolvePromptPath(language, flavor);
        String prompt = promptManager.loadPrompt(promptPath);
        log.info(
            "Loaded prompt from path='{}' for language='{}', length='{}'",
            promptPath,
            language,
            prompt != null ? prompt.length() : 0
        );

        String name = clientName != null ? clientName : config.getDefaultClient();
        LLMClient client = clientFactory.get(name);
        if (client == null) {
            log.warn("LLM client '{}' not found, falling back to default", name);
            client = clientFactory.get(config.getDefaultClient());
        }
        log.info("Using LLM client '{}'", name);

        List<ChatMessage> messages = buildMessages(prompt, cleanInput, personalizationContext, language, flavor);
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
        WordPersonalizationContext personalizationContext,
        Language language,
        DictionaryFlavor flavor
    ) {
        List<ChatMessage> messages = new ArrayList<>();
        messages.add(new ChatMessage("system", prompt));
        String personaInstruction = renderPersonaInstruction(personalizationContext);
        if (personaInstruction != null) {
            messages.add(new ChatMessage("system", personaInstruction));
        }
        String flavorInstruction = renderFlavorInstruction(language, flavor);
        if (flavorInstruction != null) {
            messages.add(new ChatMessage("system", flavorInstruction));
        }
        messages.add(new ChatMessage("user", renderUserPayload(cleanInput, personalizationContext, language, flavor)));
        return messages;
    }

    private String renderPersonaInstruction(WordPersonalizationContext personalizationContext) {
        if (personalizationContext == null || !personalizationContext.hasSignals()) {
            return null;
        }
        StringBuilder builder = new StringBuilder();
        builder.append("你正在为").append(personalizationContext.personaDescriptor()).append("提供词汇讲解");
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

    private String renderUserPayload(
        String cleanInput,
        WordPersonalizationContext personalizationContext,
        Language language,
        DictionaryFlavor flavor
    ) {
        StringBuilder builder = new StringBuilder("查询词汇：").append(cleanInput);
        if (language == Language.CHINESE) {
            appendChineseGuidance(builder, cleanInput, flavor);
        } else {
            appendEnglishGuidance(builder, flavor);
        }
        if (personalizationContext != null && personalizationContext.hasSignals()) {
            if (!personalizationContext.recentTerms().isEmpty()) {
                builder.append("\n近期检索：").append(String.join("、", personalizationContext.recentTerms()));
            }
            if (StringUtils.hasText(personalizationContext.goal())) {
                builder.append("\n学习目标：").append(personalizationContext.goal());
            }
            builder.append(renderPersonalizedTone(flavor));
        } else {
            builder.append(renderDefaultTone(flavor));
        }
        return builder.toString();
    }

    private void appendChineseGuidance(StringBuilder builder, String cleanInput, DictionaryFlavor flavor) {
        ChineseEntryProfile profile = resolveChineseEntryProfile(cleanInput);
        builder
            .append("\n条目结构定位：")
            .append(profile.typeLabel())
            .append("\n写作指引：")
            .append(profile.guidance());
        if (flavor == DictionaryFlavor.MONOLINGUAL_CHINESE) {
            builder.append("\n结构要求：请以中文为主线编写释义、例句与用法说明，遵循模板并以 <END> 收尾。");
        } else {
            builder.append("\n结构要求：请以英文释义为主，配套中文例句与 English Rendering，对齐模板并以 <END> 收尾。");
        }
    }

    private void appendEnglishGuidance(StringBuilder builder, DictionaryFlavor flavor) {
        builder.append("\n结构要求：保持模板的分层释义、例句与语法说明，并以 <END> 结尾。");
        if (flavor == DictionaryFlavor.MONOLINGUAL_ENGLISH) {
            builder.append("\n输出语言：仅使用英文完成释义、例句与所有说明，严禁出现中文或其他语言翻译。");
        }
    }

    private String renderDefaultTone(DictionaryFlavor flavor) {
        if (flavor == DictionaryFlavor.MONOLINGUAL_ENGLISH) {
            return "\n请保持语气亲切且专业，所有内容须使用英文。\n请确保释义、用法说明与示例完整。";
        }
        if (flavor == DictionaryFlavor.MONOLINGUAL_CHINESE) {
            return "\n请保持语气亲切且专业，使用中文完成所有章节，确保释义、用法说明与示例完整。";
        }
        return "\n请确保释义、用法说明与示例完整。";
    }

    private String renderPersonalizedTone(DictionaryFlavor flavor) {
        if (flavor == DictionaryFlavor.MONOLINGUAL_ENGLISH) {
            return "\n请结合画像输出结构化释义与语义差异（英文表达）。";
        }
        if (flavor == DictionaryFlavor.MONOLINGUAL_CHINESE) {
            return "\n请结合画像输出结构化释义与语义差异（中文表达）。";
        }
        return "\n请结合画像输出结构化释义与语义差异。";
    }

    private String renderFlavorInstruction(Language language, DictionaryFlavor flavor) {
        if (flavor == null) {
            return null;
        }
        if (language == Language.ENGLISH) {
            if (flavor == DictionaryFlavor.MONOLINGUAL_ENGLISH) {
                return "你正在输出高端英语词典条目，请严格使用英文完成所有章节，避免出现任何中文或翻译提示。";
            }
            if (flavor == DictionaryFlavor.BILINGUAL) {
                return "请确保每个章节都提供精准的中文译文与注释，让读者能在英语释义旁同步获得优雅的中文理解。";
            }
        }
        if (language == Language.CHINESE && flavor == DictionaryFlavor.MONOLINGUAL_CHINESE) {
            return "你正在为高级中文辞书撰写条目，请全程使用中文呈现所有章节，避免加入英文解释或翻译。";
        }
        return null;
    }

    private ChineseEntryProfile resolveChineseEntryProfile(String cleanInput) {
        if (!StringUtils.hasText(cleanInput)) {
            return new ChineseEntryProfile(
                "Multi-character Word",
                "未识别输入，按常规汉语词语处理，突出现代义项与搭配。"
            );
        }
        String condensed = cleanInput.replaceAll("\\s+", "");
        int codePoints = condensed.codePointCount(0, condensed.length());
        boolean containsHan = condensed
            .codePoints()
            .anyMatch(cp -> Character.UnicodeScript.of(cp) == Character.UnicodeScript.HAN);
        if (!containsHan) {
            return new ChineseEntryProfile(
                "Multi-character Word",
                "包含非汉字字符，请解释其在中文语境中的意义来源，并提供英文释义。"
            );
        }
        boolean allHan = condensed
            .codePoints()
            .allMatch(cp -> Character.UnicodeScript.of(cp) == Character.UnicodeScript.HAN);
        if (!allHan) {
            return new ChineseEntryProfile(
                "Multi-character Word",
                "含汉字与其他符号混写，需补充借词背景，同时仍按词语结构组织英文释义。"
            );
        }
        if (codePoints == 1) {
            return new ChineseEntryProfile(
                "Single Character",
                "请拆解字源、构形与历史演变，再补充当代主流义项与用例。"
            );
        }
        return new ChineseEntryProfile("Multi-character Word", "标准汉语词语，请分层呈现核心义项与常见搭配。");
    }

    private record ChineseEntryProfile(String typeLabel, String guidance) {}
}
