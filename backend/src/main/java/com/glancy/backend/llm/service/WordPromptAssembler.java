package com.glancy.backend.llm.service;

import com.glancy.backend.dto.WordPersonalizationContext;
import com.glancy.backend.entity.DictionaryFlavor;
import com.glancy.backend.entity.Language;
import com.glancy.backend.llm.model.ChatMessage;
import com.glancy.backend.llm.model.ChatRole;
import com.glancy.backend.llm.prompt.PromptTemplateRenderer;
import com.glancy.backend.llm.service.WordEntryProfileResolver.EntryProfile;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

/**
 * 背景：
 *  - 词典检索需组合系统提示词、个性化画像与用户查询，原实现通过字符串拼接难以维护。
 * 目的：
 *  - 借助模板渲染器从常量模板加载 Prompt 片段，按语言与风味策略装配模型消息。
 * 关键决策与取舍：
 *  - 通过常量目录集中管理模板内容，避免散落的硬编码字符串。
 *  - 维持语气策略映射，便于未来按风味扩展差异化语气指令。
 * 影响范围：
 *  - 服务层在组合消息时改为依赖模板渲染，相关单测需更新断言方式。
 * 演进与TODO：
 *  - 可引入缓存刷新或配置化模板切换支持多版本 Prompt。
 */
@Component
public class WordPromptAssembler {

    private final Map<DictionaryFlavor, WordPromptToneStrategy> toneStrategies;
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
        messages.add(new ChatMessage(ChatRole.SYSTEM.role(), systemPrompt));
        String personaInstruction = renderPersonaInstruction(personalizationContext);
        if (personaInstruction != null) {
            messages.add(new ChatMessage(ChatRole.SYSTEM.role(), personaInstruction));
        }
        String flavorInstruction = renderFlavorInstruction(language, flavor);
        if (flavorInstruction != null) {
            messages.add(new ChatMessage(ChatRole.SYSTEM.role(), flavorInstruction));
        }
        String payload = renderUserPayload(normalizedTerm, personalizationContext, language, flavor);
        messages.add(new ChatMessage(ChatRole.USER.role(), payload));
        return messages;
    }

    private Map<DictionaryFlavor, WordPromptToneStrategy> initialiseToneStrategies() {
        return Map.of(
            DictionaryFlavor.MONOLINGUAL_ENGLISH,
            WordPromptToneStrategy.ENGLISH,
            DictionaryFlavor.MONOLINGUAL_CHINESE,
            WordPromptToneStrategy.CHINESE,
            DictionaryFlavor.BILINGUAL,
            WordPromptToneStrategy.BILINGUAL
        );
    }

    private String renderPersonaInstruction(WordPersonalizationContext context) {
        if (context == null || !context.hasSignals()) {
            return null;
        }
        String descriptor = StringUtils.hasText(context.personaDescriptor())
            ? context.personaDescriptor()
            : WordPromptFallbacks.personaDescriptor();
        return templateRenderer.render(
            WordPromptTemplateConstants.PERSONA_BASE,
            buildPersonaContext(context, descriptor)
        );
    }

    private String renderTextClause(String value, String template, WordPromptContextKey placeholder) {
        if (!StringUtils.hasText(value)) {
            return "";
        }
        return templateRenderer.render(template, WordPromptContext.build(values -> values.put(placeholder, value)));
    }

    private String renderInterestsClause(WordPersonalizationContext context) {
        if (context.interests() == null || context.interests().isEmpty()) {
            return "";
        }
        String interests = String.join(WordPromptFallbacks.listDelimiter(), context.interests());
        return templateRenderer.render(
            WordPromptTemplateConstants.PERSONA_INTERESTS_CLAUSE,
            WordPromptContext.build(values -> values.put(WordPromptContextKey.CLAUSE_INTERESTS, interests))
        );
    }

    private Map<String, String> buildPersonaContext(WordPersonalizationContext context, String descriptor) {
        return WordPromptContext.build(values -> {
            values.put(WordPromptContextKey.PERSONA_DESCRIPTOR, descriptor);
            values.put(
                WordPromptContextKey.PERSONA_TONE_CLAUSE,
                renderTextClause(
                    context.preferredTone(),
                    WordPromptTemplateConstants.PERSONA_TONE_CLAUSE,
                    WordPromptContextKey.CLAUSE_TONE
                )
            );
            values.put(
                WordPromptContextKey.PERSONA_GOAL_CLAUSE,
                renderTextClause(
                    context.goal(),
                    WordPromptTemplateConstants.PERSONA_GOAL_CLAUSE,
                    WordPromptContextKey.CLAUSE_GOAL
                )
            );
            values.put(WordPromptContextKey.PERSONA_INTERESTS_CLAUSE, renderInterestsClause(context));
        });
    }

    private String renderFlavorInstruction(Language language, DictionaryFlavor flavor) {
        if (flavor == null) {
            return null;
        }
        if (language == Language.ENGLISH) {
            if (flavor == DictionaryFlavor.MONOLINGUAL_ENGLISH) {
                return templateRenderer.render(WordPromptTemplateConstants.FLAVOR_ENGLISH_MONOLINGUAL, Map.of());
            }
            if (flavor == DictionaryFlavor.BILINGUAL) {
                return templateRenderer.render(WordPromptTemplateConstants.FLAVOR_ENGLISH_BILINGUAL, Map.of());
            }
        }
        if (language == Language.CHINESE && flavor == DictionaryFlavor.MONOLINGUAL_CHINESE) {
            return templateRenderer.render(WordPromptTemplateConstants.FLAVOR_CHINESE_MONOLINGUAL, Map.of());
        }
        return null;
    }

    private String renderUserPayload(
        String normalizedTerm,
        WordPersonalizationContext context,
        Language language,
        DictionaryFlavor flavor
    ) {
        WordPromptToneStrategy strategy = toneStrategies.getOrDefault(flavor, WordPromptToneStrategy.NEUTRAL);
        if (language == Language.CHINESE) {
            return renderChinesePayload(normalizedTerm, context, flavor, strategy);
        }
        return renderEnglishPayload(normalizedTerm, context, flavor, strategy);
    }

    private String renderChinesePayload(
        String normalizedTerm,
        WordPersonalizationContext context,
        DictionaryFlavor flavor,
        WordPromptToneStrategy strategy
    ) {
        EntryProfile profile = entryProfileResolver.resolve(Language.CHINESE, normalizedTerm, flavor);
        return templateRenderer.render(
            WordPromptTemplateConstants.USER_CHINESE_PAYLOAD,
            WordPromptContext.build(values -> {
                values.put(WordPromptContextKey.TERM, nullToEmpty(normalizedTerm));
                values.put(WordPromptContextKey.ENTRY_TYPE, profile.typeLabel());
                values.put(WordPromptContextKey.ENTRY_GUIDANCE, profile.guidance());
                values.put(WordPromptContextKey.STRUCTURE_REQUIREMENT, renderChineseStructureRequirement(flavor));
                values.put(WordPromptContextKey.RECENT_TERMS_SECTION, renderRecentTermsSection(context));
                values.put(WordPromptContextKey.GOAL_SECTION, renderGoalSection(context));
                values.put(WordPromptContextKey.TONE_DIRECTIVE, renderToneDirective(context, strategy));
            })
        );
    }

    private String renderEnglishPayload(
        String normalizedTerm,
        WordPersonalizationContext context,
        DictionaryFlavor flavor,
        WordPromptToneStrategy strategy
    ) {
        return templateRenderer.render(
            WordPromptTemplateConstants.USER_ENGLISH_PAYLOAD,
            WordPromptContext.build(values -> {
                values.put(WordPromptContextKey.TERM, nullToEmpty(normalizedTerm));
                values.put(WordPromptContextKey.STRUCTURE_REQUIREMENT, renderEnglishStructureRequirement(flavor));
                values.put(WordPromptContextKey.RECENT_TERMS_SECTION, renderRecentTermsSection(context));
                values.put(WordPromptContextKey.GOAL_SECTION, renderGoalSection(context));
                values.put(WordPromptContextKey.TONE_DIRECTIVE, renderToneDirective(context, strategy));
            })
        );
    }

    private String renderChineseStructureRequirement(DictionaryFlavor flavor) {
        String template = flavor == DictionaryFlavor.MONOLINGUAL_CHINESE
            ? WordPromptTemplateConstants.STRUCTURE_CHINESE_MONOLINGUAL
            : WordPromptTemplateConstants.STRUCTURE_CHINESE_BILINGUAL;
        return templateRenderer.render(template, Map.of());
    }

    private String renderEnglishStructureRequirement(DictionaryFlavor flavor) {
        String template = flavor == DictionaryFlavor.MONOLINGUAL_ENGLISH
            ? WordPromptTemplateConstants.STRUCTURE_ENGLISH_MONOLINGUAL
            : WordPromptTemplateConstants.STRUCTURE_ENGLISH_BILINGUAL;
        return templateRenderer.render(template, Map.of());
    }

    private String renderRecentTermsSection(WordPersonalizationContext context) {
        if (context == null || context.recentTerms() == null || context.recentTerms().isEmpty()) {
            return "";
        }
        String joined = String.join(WordPromptFallbacks.listDelimiter(), context.recentTerms());
        return templateRenderer.render(
            WordPromptTemplateConstants.USER_RECENT_TERMS,
            WordPromptContext.build(values -> values.put(WordPromptContextKey.CLAUSE_TERMS, joined))
        );
    }

    private String renderGoalSection(WordPersonalizationContext context) {
        if (context == null || !StringUtils.hasText(context.goal())) {
            return "";
        }
        return templateRenderer.render(
            WordPromptTemplateConstants.USER_GOAL,
            WordPromptContext.build(values -> values.put(WordPromptContextKey.CLAUSE_GOAL, context.goal()))
        );
    }

    private String renderToneDirective(WordPersonalizationContext context, WordPromptToneStrategy strategy) {
        boolean hasPersonaSignals = context != null && context.hasSignals();
        String template = hasPersonaSignals ? strategy.personalizedTemplate() : strategy.defaultTemplate();
        return templateRenderer.render(template, Map.of());
    }

    private String nullToEmpty(String value) {
        return value == null ? "" : value;
    }
}
