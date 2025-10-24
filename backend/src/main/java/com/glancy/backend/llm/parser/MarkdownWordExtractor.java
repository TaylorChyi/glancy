package com.glancy.backend.llm.parser;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * 背景：
 *  - Doubao LLM 以 Markdown 章节组织词条释义，新协议频繁迭代导致章节标题不断扩张。
 * 目的：
 *  - 通过集中式映射策略，将多源标题规范化为后端可消费的领域枚举，确保解析结果稳定输出。
 * 关键决策与取舍：
 *  - 采用不可变映射维护标题->领域段落的绑定，方便未来新增标题时只需扩展映射表。
 *  - 将 Collocations 等新标题复用现有语义槽位（phrases/definitions），避免破坏现有 API 契约。
 * 影响范围：
 *  - 所有依赖 MarkdownWordSnapshot 的前后端词表展示模块。
 * 演进与TODO：
 *  - 协议若新增需前后端同步的字段（如真正独立的历史沿革版块），需扩展 MarkdownWordSnapshot 结构并更新映射表。
 */
final class MarkdownWordExtractor {

    private static final Pattern NUMBERED_LIST_PATTERN = Pattern.compile("^(\\d+)[\\.)]\\s*(.+)$");
    private static final Pattern KEY_VALUE_PATTERN = Pattern.compile(
        "^(?<key>[\\p{L}\\p{IsHan}\\s]+)[:：]\\s*(?<value>.+)$"
    );
    /**
     * 章节映射表：key 为归一化后的标题字符串。
     * 说明：
     *  - 使用 LinkedHashMap 保留声明顺序，便于代码审查与后续补充。
     *  - Collocations 被视为词组用法，与现有 phrases 集合语义一致；HistoricalResonance 强调语义背景，归入 definitions。
     */
    private static final Map<String, Section> SECTION_BY_HEADING = buildSectionMapping();

    private MarkdownWordExtractor() {}

    static MarkdownWordSnapshot extract(String markdown, String fallbackTerm) {
        if (markdown == null) {
            return new MarkdownWordSnapshot(
                fallbackTerm,
                List.of(),
                List.of(),
                List.of(),
                List.of(),
                List.of(),
                List.of(),
                null,
                null
            );
        }

        Set<String> definitions = new LinkedHashSet<>();
        Set<String> synonyms = new LinkedHashSet<>();
        Set<String> antonyms = new LinkedHashSet<>();
        Set<String> related = new LinkedHashSet<>();
        Set<String> variations = new LinkedHashSet<>();
        Set<String> phrases = new LinkedHashSet<>();

        Section currentSection = Section.DEFINITION;
        String resolvedTerm = fallbackTerm;
        boolean headingApplied = false;
        String example = null;
        String phonetic = null;
        boolean insideFence = false;
        String firstContentLine = null;

        for (String rawLine : markdown.split("\\R")) {
            String line = rawLine.trim();
            if (line.isEmpty()) {
                continue;
            }

            if (line.startsWith("```")) {
                insideFence = !insideFence;
                continue;
            }
            if (insideFence) {
                continue;
            }

            if (line.startsWith("#")) {
                String heading = line.replaceFirst("^#+", "").trim();
                if (heading.isEmpty()) {
                    continue;
                }
                if (!headingApplied || resolvedTerm == null || resolvedTerm.isBlank()) {
                    resolvedTerm = heading;
                    headingApplied = true;
                }
                currentSection = resolveSection(heading);
                continue;
            }

            if (firstContentLine == null) {
                firstContentLine = line;
            }

            Matcher numberedMatcher = NUMBERED_LIST_PATTERN.matcher(line);
            if (numberedMatcher.matches()) {
                line = numberedMatcher.group(2).trim();
            }

            if (line.startsWith("-") || line.startsWith("*")) {
                String value = line.substring(1).trim();
                if (currentSection == Section.EXAMPLE) {
                    example = selectFirstNonBlank(example, value);
                    continue;
                }
                if (currentSection == Section.PHONETIC) {
                    phonetic = selectFirstNonBlank(phonetic, value);
                    continue;
                }
                appendToSection(currentSection, value, definitions, synonyms, antonyms, related, variations, phrases);
                continue;
            }

            Matcher keyValueMatcher = KEY_VALUE_PATTERN.matcher(line);
            if (keyValueMatcher.matches()) {
                String key = keyValueMatcher.group("key").trim();
                String value = keyValueMatcher.group("value").trim();
                Section inlineSection = resolveSection(key);
                if (inlineSection == Section.PHONETIC) {
                    phonetic = selectFirstNonBlank(phonetic, value);
                    continue;
                }
                if (inlineSection == Section.EXAMPLE) {
                    example = selectFirstNonBlank(example, value);
                    continue;
                }
                if (inlineSection == Section.SYNONYMS) {
                    synonyms.addAll(splitList(value));
                    continue;
                }
                if (inlineSection == Section.ANTONYMS) {
                    antonyms.addAll(splitList(value));
                    continue;
                }
                if (inlineSection == Section.RELATED) {
                    related.addAll(splitList(value));
                    continue;
                }
                if (inlineSection == Section.VARIATIONS) {
                    variations.addAll(splitList(value));
                    continue;
                }
                if (inlineSection == Section.PHRASES) {
                    phrases.addAll(splitList(value));
                    continue;
                }
                if (inlineSection == Section.DEFINITION) {
                    definitions.add(value);
                    continue;
                }
            }

            if (currentSection == Section.EXAMPLE) {
                example = selectFirstNonBlank(example, line);
                continue;
            }
            if (currentSection == Section.PHONETIC) {
                phonetic = selectFirstNonBlank(phonetic, line);
                continue;
            }
            appendToSection(currentSection, line, definitions, synonyms, antonyms, related, variations, phrases);
        }

        if (definitions.isEmpty() && firstContentLine != null) {
            definitions.add(firstContentLine);
        }

        return new MarkdownWordSnapshot(
            resolvedTerm == null || resolvedTerm.isBlank() ? fallbackTerm : resolvedTerm,
            List.copyOf(definitions),
            List.copyOf(synonyms),
            List.copyOf(antonyms),
            List.copyOf(related),
            List.copyOf(variations),
            List.copyOf(phrases),
            example,
            phonetic
        );
    }

    private static Section resolveSection(String heading) {
        String normalized = heading
            .toLowerCase(Locale.ROOT)
            .replace("：", ":")
            .replaceAll("[^a-z\\p{IsHan}]+", "")
            .trim();
        if (normalized.isEmpty()) {
            return Section.DEFINITION;
        }
        return SECTION_BY_HEADING.getOrDefault(normalized, Section.DEFINITION);
    }

    private static void appendToSection(
        Section section,
        String value,
        Set<String> definitions,
        Set<String> synonyms,
        Set<String> antonyms,
        Set<String> related,
        Set<String> variations,
        Set<String> phrases
    ) {
        if (value == null || value.isBlank()) {
            return;
        }
        switch (section) {
            case SYNONYMS -> synonyms.addAll(splitList(value));
            case ANTONYMS -> antonyms.addAll(splitList(value));
            case RELATED -> related.addAll(splitList(value));
            case VARIATIONS -> variations.addAll(splitList(value));
            case PHRASES -> phrases.add(value);
            default -> definitions.add(value);
        }
    }

    private static List<String> splitList(String value) {
        if (value == null || value.isBlank()) {
            return List.of();
        }
        String[] parts = value.split("[，,;；]\s*|、");
        List<String> result = new ArrayList<>();
        for (String part : parts) {
            String trimmed = part.trim();
            if (!trimmed.isEmpty()) {
                result.add(trimmed);
            }
        }
        if (!result.isEmpty()) {
            return result;
        }
        return List.of(value.trim());
    }

    private static String selectFirstNonBlank(String current, String candidate) {
        if (current != null && !current.isBlank()) {
            return current;
        }
        if (candidate == null || candidate.isBlank()) {
            return current;
        }
        return candidate.trim();
    }

    private enum Section {
        DEFINITION,
        SYNONYMS,
        ANTONYMS,
        RELATED,
        VARIATIONS,
        PHRASES,
        EXAMPLE,
        PHONETIC,
    }

    private static Map<String, Section> buildSectionMapping() {
        Map<String, Section> mapping = new LinkedHashMap<>();
        register(
            mapping,
            Section.DEFINITION,
            "definition",
            "definitions",
            "meaning",
            "meanings",
            "释义",
            "解释",
            "含义",
            "historicalresonance"
        );
        register(mapping, Section.SYNONYMS, "synonym", "synonyms", "同义词");
        register(mapping, Section.ANTONYMS, "antonym", "antonyms", "反义词");
        register(mapping, Section.RELATED, "related", "relatedwords", "相关词", "相关词汇");
        register(
            mapping,
            Section.VARIATIONS,
            "variation",
            "variations",
            "变体",
            "变形",
            "词形",
            "derivativesextendedforms",
            "derivatives",
            "extendedforms"
        );
        register(mapping, Section.PHRASES, "phrase", "phrases", "常见词组", "词组", "collocation", "collocations");
        register(mapping, Section.EXAMPLE, "example", "examples", "例句", "用法示例", "用例");
        register(mapping, Section.PHONETIC, "phonetic", "pronunciation", "音标", "发音");
        return Map.copyOf(mapping);
    }

    private static void register(Map<String, Section> mapping, Section section, String... headings) {
        for (String heading : headings) {
            mapping.put(heading, section);
        }
    }
}
