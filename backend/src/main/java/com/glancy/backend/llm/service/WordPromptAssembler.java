package com.glancy.backend.llm.service;

import com.glancy.backend.dto.WordPersonalizationContext;
import com.glancy.backend.entity.DictionaryFlavor;
import com.glancy.backend.entity.Language;
import com.glancy.backend.llm.model.ChatMessage;
import java.util.ArrayList;
import java.util.EnumMap;
import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

/**
 * 背景：
 *  - 同步检索链路需要根据语言、词典风味与个性化画像动态拼装 Prompt 指令。
 * 目的：
 *  - 利用策略组合的方式将角色设定、结构约束与语气提示集中到单一组件中，供 {@link WordSearcherImpl} 复用。
 * 关键决策与取舍：
 *  - 通过 ToneStrategy 枚举化语气差异，避免在调用侧使用 if/else 分支。
 *  - 中文条目结构抽象成 ChineseEntryProfile，便于未来扩展更多条目类型。
 * 影响范围：
 *  - 服务层可直接注入该组件以获得一致的消息构造逻辑。
 * 演进与TODO：
 *  - 后续可以将策略映射迁移到配置驱动，以支持 A/B Prompt 试验。
 */
@Component
public class WordPromptAssembler {

    private final Map<DictionaryFlavor, ToneStrategy> toneStrategies;

    public WordPromptAssembler() {
        this.toneStrategies = initialiseToneStrategies();
    }

    /**
     * 意图：将系统 Prompt、个性化指令与用户查询负载组合成模型可消费的消息序列。
     * 输入：
     *  - systemPrompt：模板化的系统提示词，约束整体输出结构。
     *  - normalizedTerm：经归一化的查询词条。
     *  - personalizationContext：个性化上下文，可能为空。
     *  - language：查询语言，用于判断结构提示。
     *  - flavor：词典风味，决定语气与输出语言约束。
     * 输出：
     *  - 包含多个 ChatMessage 的列表，顺序遵循 system -> persona -> flavor -> user。
     * 流程：
     *  1) 注入系统 Prompt；
     *  2) 根据画像与风味策略拼装附加的 system 指令；
     *  3) 构造用户消息，结合语言、条目结构与语气提示；
     * 错误处理：策略映射缺省时回落到 NeutralToneStrategy。
     * 复杂度：O(n) 与消息数线性相关，主要受字符串拼接影响。
     */
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
        messages.add(
            new ChatMessage("user", renderUserPayload(normalizedTerm, personalizationContext, language, flavor))
        );
        return messages;
    }

    private Map<DictionaryFlavor, ToneStrategy> initialiseToneStrategies() {
        EnumMap<DictionaryFlavor, ToneStrategy> strategies = new EnumMap<>(DictionaryFlavor.class);
        strategies.put(DictionaryFlavor.MONOLINGUAL_ENGLISH, ToneStrategy.english());
        strategies.put(DictionaryFlavor.MONOLINGUAL_CHINESE, ToneStrategy.chinese());
        strategies.put(DictionaryFlavor.BILINGUAL, ToneStrategy.bilingual());
        return strategies;
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
        String normalizedTerm,
        WordPersonalizationContext personalizationContext,
        Language language,
        DictionaryFlavor flavor
    ) {
        StringBuilder builder = new StringBuilder("查询词汇：").append(normalizedTerm);
        if (language == Language.CHINESE) {
            appendChineseGuidance(builder, normalizedTerm, flavor);
        } else {
            appendEnglishGuidance(builder, flavor);
        }
        ToneStrategy strategy = toneStrategies.getOrDefault(flavor, ToneStrategy.neutral());
        if (personalizationContext != null && personalizationContext.hasSignals()) {
            if (!personalizationContext.recentTerms().isEmpty()) {
                builder.append("\n近期检索：").append(String.join("、", personalizationContext.recentTerms()));
            }
            if (StringUtils.hasText(personalizationContext.goal())) {
                builder.append("\n学习目标：").append(personalizationContext.goal());
            }
            builder.append(strategy.personalisedTone());
        } else {
            builder.append(strategy.defaultTone());
        }
        return builder.toString();
    }

    private void appendChineseGuidance(StringBuilder builder, String normalizedTerm, DictionaryFlavor flavor) {
        ChineseEntryProfile profile = resolveChineseEntryProfile(normalizedTerm);
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

    private ChineseEntryProfile resolveChineseEntryProfile(String normalizedTerm) {
        if (!StringUtils.hasText(normalizedTerm)) {
            return new ChineseEntryProfile(
                "Multi-character Word",
                "未识别输入，按常规汉语词语处理，突出现代义项与搭配。"
            );
        }
        String condensed = normalizedTerm.replaceAll("\\s+", "");
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

    private record ToneStrategy(String defaultTone, String personalisedTone) {
        private static ToneStrategy english() {
            return new ToneStrategy(
                "\n请保持语气亲切且专业，所有内容须使用英文。\n请确保释义、用法说明与示例完整。",
                "\n请结合画像输出结构化释义与语义差异（英文表达）。"
            );
        }

        private static ToneStrategy chinese() {
            return new ToneStrategy(
                "\n请保持语气亲切且专业，使用中文完成所有章节，确保释义、用法说明与示例完整。",
                "\n请结合画像输出结构化释义与语义差异（中文表达）。"
            );
        }

        private static ToneStrategy bilingual() {
            return new ToneStrategy("\n请确保释义、用法说明与示例完整。", "\n请结合画像输出结构化释义与语义差异。");
        }

        private static ToneStrategy neutral() {
            return new ToneStrategy("\n请确保释义、用法说明与示例完整。", "\n请结合画像输出结构化释义与语义差异。");
        }
    }
}
