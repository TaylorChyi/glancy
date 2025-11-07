package com.glancy.backend.llm.service;

import com.glancy.backend.entity.DictionaryFlavor;
import com.glancy.backend.entity.Language;
import com.glancy.backend.llm.prompt.PromptTemplateRenderer;
import java.util.EnumMap;
import java.util.Map;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

/**
 * 背景：
 *  - 词条类型与写作引导之前直接硬编码在 {@link WordPromptAssembler} 内，扩展其他语言困难。
 * 目的：
 *  - 将词条画像解析抽象为策略工厂，按语言路由到对应实现并通过内存模板提供可扩展的指引文案。
 * 关键决策与取舍：
 *  - 采用策略模式将不同语言的解析逻辑解耦；指引内容统一交给模板渲染器，避免硬编码。
 * 影响范围：
 *  - Prompt 装配器与未来的多语言策略共享该组件，模板常量集中管理。
 * 演进与TODO：
 *  - 后续可引入配置驱动的策略注册，支持运行时扩展或 A/B 实验。
 */
@Component
public class WordEntryProfileResolver {

    private final Map<Language, LanguageEntryProfileStrategy> strategies = new EnumMap<>(Language.class);
    private final LanguageEntryProfileStrategy defaultStrategy;
    private final PromptTemplateRenderer templateRenderer;

    public WordEntryProfileResolver(PromptTemplateRenderer templateRenderer) {
        this.templateRenderer = templateRenderer;
        this.defaultStrategy = new DefaultEntryProfileStrategy(templateRenderer);
        strategies.put(Language.CHINESE, new ChineseEntryProfileStrategy(templateRenderer));
    }

    /**
     * 意图：根据语言与规范化后的检索词推导词条类型与写作指引。
     * 输入：语言、归一化检索词、词典风味。
     * 输出：包含类型标签与写作指引的 {@link EntryProfile}。
     * 流程：
     *  1) 按语言查找策略；若未匹配使用默认策略。
     *  2) 策略内部根据术语特征选择模板并渲染。
     * 错误处理：当模板缺失时渲染器会抛出语义化异常以便上层捕获。
     * 复杂度：O(n) 取决于字符串遍历次数，用于检测字符类别。
     */
    public EntryProfile resolve(Language language, String normalizedTerm, DictionaryFlavor flavor) {
        LanguageEntryProfileStrategy strategy = strategies.getOrDefault(language, defaultStrategy);
        return strategy.resolve(normalizedTerm, flavor);
    }

    public record EntryProfile(String typeLabel, String guidance) {}

    private interface LanguageEntryProfileStrategy {
        EntryProfile resolve(String normalizedTerm, DictionaryFlavor flavor);
    }

    private static final class DefaultEntryProfileStrategy implements LanguageEntryProfileStrategy {

        private final PromptTemplateRenderer renderer;

        private DefaultEntryProfileStrategy(PromptTemplateRenderer renderer) {
            this.renderer = renderer;
        }

        @Override
        public EntryProfile resolve(String normalizedTerm, DictionaryFlavor flavor) {
            String label = renderer.render(WordPromptTemplate.ENTRY_LABEL_DEFAULT, Map.of());
            String guidance = renderer.render(WordPromptTemplate.ENTRY_GUIDANCE_DEFAULT, Map.of());
            return new EntryProfile(label, guidance);
        }
    }

    private static final class ChineseEntryProfileStrategy implements LanguageEntryProfileStrategy {

        private final PromptTemplateRenderer renderer;
        private final Map<Category, ProfileTemplate> templates = new EnumMap<>(Category.class);

        private ChineseEntryProfileStrategy(PromptTemplateRenderer renderer) {
            this.renderer = renderer;
            templates.put(
                Category.EMPTY_OR_UNKNOWN,
                new ProfileTemplate(
                    WordPromptTemplate.ENTRY_LABEL_CHINESE_MULTI,
                    WordPromptTemplate.ENTRY_GUIDANCE_CHINESE_UNKNOWN
                )
            );
            templates.put(
                Category.NON_HAN,
                new ProfileTemplate(
                    WordPromptTemplate.ENTRY_LABEL_CHINESE_MULTI,
                    WordPromptTemplate.ENTRY_GUIDANCE_CHINESE_NON_HAN
                )
            );
            templates.put(
                Category.MIXED_SCRIPT,
                new ProfileTemplate(
                    WordPromptTemplate.ENTRY_LABEL_CHINESE_MULTI,
                    WordPromptTemplate.ENTRY_GUIDANCE_CHINESE_MIXED
                )
            );
            templates.put(
                Category.SINGLE_CHARACTER,
                new ProfileTemplate(
                    WordPromptTemplate.ENTRY_LABEL_CHINESE_SINGLE,
                    WordPromptTemplate.ENTRY_GUIDANCE_CHINESE_SINGLE
                )
            );
            templates.put(
                Category.MULTI_CHARACTER,
                new ProfileTemplate(
                    WordPromptTemplate.ENTRY_LABEL_CHINESE_MULTI,
                    WordPromptTemplate.ENTRY_GUIDANCE_CHINESE_MULTI
                )
            );
        }

        @Override
        public EntryProfile resolve(String normalizedTerm, DictionaryFlavor flavor) {
            Category category = categorize(normalizedTerm);
            ProfileTemplate template = templates.getOrDefault(
                category,
                new ProfileTemplate(
                    WordPromptTemplate.ENTRY_LABEL_CHINESE_MULTI,
                    WordPromptTemplate.ENTRY_GUIDANCE_CHINESE_MULTI
                )
            );
            return template.render(renderer);
        }

        private Category categorize(String normalizedTerm) {
            if (!StringUtils.hasText(normalizedTerm)) {
                return Category.EMPTY_OR_UNKNOWN;
            }
            String condensed = normalizedTerm.replaceAll("\\s+", "");
            int length = condensed.length();
            if (length == 0) {
                return Category.EMPTY_OR_UNKNOWN;
            }
            boolean containsHan = condensed
                .codePoints()
                .anyMatch(cp -> Character.UnicodeScript.of(cp) == Character.UnicodeScript.HAN);
            if (!containsHan) {
                return Category.NON_HAN;
            }
            boolean allHan = condensed
                .codePoints()
                .allMatch(cp -> Character.UnicodeScript.of(cp) == Character.UnicodeScript.HAN);
            if (!allHan) {
                return Category.MIXED_SCRIPT;
            }
            int codePoints = condensed.codePointCount(0, condensed.length());
            if (codePoints == 1) {
                return Category.SINGLE_CHARACTER;
            }
            return Category.MULTI_CHARACTER;
        }

        private enum Category {
            EMPTY_OR_UNKNOWN,
            NON_HAN,
            MIXED_SCRIPT,
            SINGLE_CHARACTER,
            MULTI_CHARACTER,
        }

        private record ProfileTemplate(WordPromptTemplate labelTemplate, WordPromptTemplate guidanceTemplate) {
            private EntryProfile render(PromptTemplateRenderer renderer) {
                String label = renderer.render(labelTemplate, Map.of());
                String guidance = renderer.render(guidanceTemplate, Map.of());
                return new EntryProfile(label, guidance);
            }
        }
    }
}
