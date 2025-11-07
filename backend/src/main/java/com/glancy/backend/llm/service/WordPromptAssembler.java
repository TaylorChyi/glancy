package com.glancy.backend.llm.service;

import com.glancy.backend.dto.WordPersonalizationContext;
import com.glancy.backend.entity.DictionaryFlavor;
import com.glancy.backend.entity.Language;
import com.glancy.backend.llm.model.ChatMessage;
import com.glancy.backend.llm.prompt.PromptTemplateRenderer;
import com.glancy.backend.llm.service.WordEntryProfileResolver.EntryProfile;
import java.util.ArrayList;
import java.util.EnumMap;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

/**
 * 背景：
 *  - 词典检索需组合系统提示词、个性化画像与用户查询，原实现通过字符串拼接难以维护。
 * 目的：
 *  - 借助模板渲染器从资源文件加载 Prompt 片段，按语言与风味策略装配模型消息。
 * 关键决策与取舍：
 *  - 采用模板枚举集中管理资源路径，避免散落的硬编码字符串。
 *  - 维持语气策略映射，便于未来按风味扩展差异化语气指令。
 * 影响范围：
 *  - 服务层在组合消息时改为依赖模板渲染，相关单测需更新断言方式。
 * 演进与TODO：
 *  - 可引入缓存刷新或配置化模板切换支持多版本 Prompt。
 */
@Component
public class WordPromptAssembler {

    private final Map<DictionaryFlavor, ToneStrategy> toneStrategies;
    private final PromptTemplateRenderer templateRenderer;
    private final WordEntryProfileResolver entryProfileResolver;

    public WordPromptAssembler(PromptTemplateRenderer templateRenderer, WordEntryProfileResolver entryProfileResolver) {
        this.templateRenderer = templateRenderer;
        this.entryProfileResolver = entryProfileResolver;
        this.toneStrategies = initialiseToneStrategies();
    }

    public List<ChatMessage> composeMessages(
        String systemPrompt,
        String normalizedTerm,
        WordPersonalizationContext personalizationContext,
        Language language,
        DictionaryFlavor flavor
    ) {
        List<ChatMessage> messages = new ArrayList<>();
        messages.add(new ChatMessage("system", systemPrompt));
        String personaInstruction = renderPersonaInstruction(personalizationContext);
        if (personaInstruction != null) {
            messages.add(new ChatMessage("system", personaInstruction));
        }
        String flavorInstruction = renderFlavorInstruction(language, flavor);
        if (flavorInstruction != null) {
            messages.add(new ChatMessage("system", flavorInstruction));
        }
        String payload = renderUserPayload(normalizedTerm, personalizationContext, language, flavor);
        messages.add(new ChatMessage("user", payload));
        return messages;
    }

    private Map<DictionaryFlavor, ToneStrategy> initialiseToneStrategies() {
        EnumMap<DictionaryFlavor, ToneStrategy> strategies = new EnumMap<>(DictionaryFlavor.class);
        strategies.put(DictionaryFlavor.MONOLINGUAL_ENGLISH, ToneStrategy.english());
        strategies.put(DictionaryFlavor.MONOLINGUAL_CHINESE, ToneStrategy.chinese());
        strategies.put(DictionaryFlavor.BILINGUAL, ToneStrategy.bilingual());
        return strategies;
    }

    private String renderPersonaInstruction(WordPersonalizationContext context) {
        if (context == null || !context.hasSignals()) {
            return null;
        }
        Map<String, String> templateContext = new HashMap<>();
        String descriptor = StringUtils.hasText(context.personaDescriptor()) ? context.personaDescriptor() : "学习者";
        templateContext.put("personaDescriptor", descriptor);
        templateContext.put(
            "toneClause",
            renderTextClause(context.preferredTone(), WordPromptTemplate.PERSONA_TONE_CLAUSE, "tone")
        );
        templateContext.put(
            "goalClause",
            renderTextClause(context.goal(), WordPromptTemplate.PERSONA_GOAL_CLAUSE, "goal")
        );
        templateContext.put("interestsClause", renderInterestsClause(context));
        return templateRenderer.render(WordPromptTemplate.PERSONA_BASE.path(), templateContext);
    }

    private String renderTextClause(String value, WordPromptTemplate template, String key) {
        if (!StringUtils.hasText(value)) {
            return "";
        }
        return templateRenderer.render(template.path(), Map.of(key, value));
    }

    private String renderInterestsClause(WordPersonalizationContext context) {
        if (context.interests() == null || context.interests().isEmpty()) {
            return "";
        }
        String interests = String.join("、", context.interests());
        return templateRenderer.render(
            WordPromptTemplate.PERSONA_INTERESTS_CLAUSE.path(),
            Map.of("interests", interests)
        );
    }

    private String renderFlavorInstruction(Language language, DictionaryFlavor flavor) {
        if (flavor == null) {
            return null;
        }
        if (language == Language.ENGLISH) {
            if (flavor == DictionaryFlavor.MONOLINGUAL_ENGLISH) {
                return templateRenderer.render(WordPromptTemplate.FLAVOR_ENGLISH_MONOLINGUAL.path(), Map.of());
            }
            if (flavor == DictionaryFlavor.BILINGUAL) {
                return templateRenderer.render(WordPromptTemplate.FLAVOR_ENGLISH_BILINGUAL.path(), Map.of());
            }
        }
        if (language == Language.CHINESE && flavor == DictionaryFlavor.MONOLINGUAL_CHINESE) {
            return templateRenderer.render(WordPromptTemplate.FLAVOR_CHINESE_MONOLINGUAL.path(), Map.of());
        }
        return null;
    }

    private String renderUserPayload(
        String normalizedTerm,
        WordPersonalizationContext context,
        Language language,
        DictionaryFlavor flavor
    ) {
        ToneStrategy strategy = toneStrategies.getOrDefault(flavor, ToneStrategy.neutral());
        if (language == Language.CHINESE) {
            return renderChinesePayload(normalizedTerm, context, flavor, strategy);
        }
        return renderEnglishPayload(normalizedTerm, context, flavor, strategy);
    }

    private String renderChinesePayload(
        String normalizedTerm,
        WordPersonalizationContext context,
        DictionaryFlavor flavor,
        ToneStrategy strategy
    ) {
        EntryProfile profile = entryProfileResolver.resolve(Language.CHINESE, normalizedTerm, flavor);
        Map<String, String> templateContext = new HashMap<>();
        templateContext.put("term", normalizedTerm == null ? "" : normalizedTerm);
        templateContext.put("entryType", profile.typeLabel());
        templateContext.put("entryGuidance", profile.guidance());
        templateContext.put("structureRequirement", renderChineseStructureRequirement(flavor));
        templateContext.put("recentTermsSection", renderRecentTermsSection(context));
        templateContext.put("goalSection", renderGoalSection(context));
        templateContext.put("toneDirective", renderToneDirective(context, strategy));
        return templateRenderer.render(WordPromptTemplate.USER_CHINESE_PAYLOAD.path(), templateContext);
    }

    private String renderEnglishPayload(
        String normalizedTerm,
        WordPersonalizationContext context,
        DictionaryFlavor flavor,
        ToneStrategy strategy
    ) {
        Map<String, String> templateContext = new HashMap<>();
        templateContext.put("term", normalizedTerm == null ? "" : normalizedTerm);
        templateContext.put("structureRequirement", renderEnglishStructureRequirement(flavor));
        templateContext.put("recentTermsSection", renderRecentTermsSection(context));
        templateContext.put("goalSection", renderGoalSection(context));
        templateContext.put("toneDirective", renderToneDirective(context, strategy));
        return templateRenderer.render(WordPromptTemplate.USER_ENGLISH_PAYLOAD.path(), templateContext);
    }

    private String renderChineseStructureRequirement(DictionaryFlavor flavor) {
        WordPromptTemplate template = flavor == DictionaryFlavor.MONOLINGUAL_CHINESE
            ? WordPromptTemplate.STRUCTURE_CHINESE_MONOLINGUAL
            : WordPromptTemplate.STRUCTURE_CHINESE_BILINGUAL;
        return templateRenderer.render(template.path(), Map.of());
    }

    private String renderEnglishStructureRequirement(DictionaryFlavor flavor) {
        WordPromptTemplate template = flavor == DictionaryFlavor.MONOLINGUAL_ENGLISH
            ? WordPromptTemplate.STRUCTURE_ENGLISH_MONOLINGUAL
            : WordPromptTemplate.STRUCTURE_ENGLISH_BILINGUAL;
        return templateRenderer.render(template.path(), Map.of());
    }

    private String renderRecentTermsSection(WordPersonalizationContext context) {
        if (context == null || context.recentTerms() == null || context.recentTerms().isEmpty()) {
            return "";
        }
        String joined = String.join("、", context.recentTerms());
        return templateRenderer.render(WordPromptTemplate.USER_RECENT_TERMS.path(), Map.of("terms", joined));
    }

    private String renderGoalSection(WordPersonalizationContext context) {
        if (context == null || !StringUtils.hasText(context.goal())) {
            return "";
        }
        return templateRenderer.render(WordPromptTemplate.USER_GOAL.path(), Map.of("goal", context.goal()));
    }

    private String renderToneDirective(WordPersonalizationContext context, ToneStrategy strategy) {
        boolean hasPersonaSignals = context != null && context.hasSignals();
        WordPromptTemplate template = hasPersonaSignals ? strategy.personalisedTemplate() : strategy.defaultTemplate();
        return templateRenderer.render(template.path(), Map.of());
    }

    private record ToneStrategy(WordPromptTemplate defaultTemplate, WordPromptTemplate personalisedTemplate) {
        private static ToneStrategy english() {
            return new ToneStrategy(
                WordPromptTemplate.TONE_ENGLISH_DEFAULT,
                WordPromptTemplate.TONE_ENGLISH_PERSONALIZED
            );
        }

        private static ToneStrategy chinese() {
            return new ToneStrategy(
                WordPromptTemplate.TONE_CHINESE_DEFAULT,
                WordPromptTemplate.TONE_CHINESE_PERSONALIZED
            );
        }

        private static ToneStrategy bilingual() {
            return new ToneStrategy(
                WordPromptTemplate.TONE_BILINGUAL_DEFAULT,
                WordPromptTemplate.TONE_BILINGUAL_PERSONALIZED
            );
        }

        private static ToneStrategy neutral() {
            return new ToneStrategy(
                WordPromptTemplate.TONE_NEUTRAL_DEFAULT,
                WordPromptTemplate.TONE_NEUTRAL_PERSONALIZED
            );
        }
    }
}
