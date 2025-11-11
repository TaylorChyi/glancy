package com.glancy.backend.llm.parser;

import java.util.LinkedHashMap;
import java.util.Locale;
import java.util.Map;

final class MarkdownSectionResolver {

    private final Map<String, MarkdownSection> sectionByHeading;

    private MarkdownSectionResolver(Map<String, MarkdownSection> sectionByHeading) {
        this.sectionByHeading = sectionByHeading;
    }

    static MarkdownSectionResolver defaultResolver() {
        return new MarkdownSectionResolver(buildSectionMapping());
    }

    MarkdownSection resolve(String heading) {
        if (heading == null) {
            return MarkdownSection.DEFINITION;
        }
        String normalized = heading
            .toLowerCase(Locale.ROOT)
            .replace("：", ":")
            .replaceAll("[^a-z\\p{IsHan}]+", "")
            .trim();
        if (normalized.isEmpty()) {
            return MarkdownSection.DEFINITION;
        }
        return sectionByHeading.getOrDefault(normalized, MarkdownSection.DEFINITION);
    }

    private static Map<String, MarkdownSection> buildSectionMapping() {
        Map<String, MarkdownSection> mapping = new LinkedHashMap<>();
        register(
            mapping,
            MarkdownSection.DEFINITION,
            "definition",
            "definitions",
            "meaning",
            "meanings",
            "释义",
            "解释",
            "含义",
            "historicalresonance"
        );
        register(mapping, MarkdownSection.SYNONYMS, "synonym", "synonyms", "同义词");
        register(mapping, MarkdownSection.ANTONYMS, "antonym", "antonyms", "反义词");
        register(mapping, MarkdownSection.RELATED, "related", "relatedwords", "相关词", "相关词汇");
        register(
            mapping,
            MarkdownSection.VARIATIONS,
            "variation",
            "variations",
            "变体",
            "变形",
            "词形",
            "derivativesextendedforms",
            "derivatives",
            "extendedforms"
        );
        register(
            mapping,
            MarkdownSection.PHRASES,
            "phrase",
            "phrases",
            "常见词组",
            "词组",
            "collocation",
            "collocations"
        );
        register(
            mapping,
            MarkdownSection.EXAMPLE,
            "example",
            "examples",
            "例句",
            "用法示例",
            "用例"
        );
        register(mapping, MarkdownSection.PHONETIC, "phonetic", "pronunciation", "音标", "发音");
        return Map.copyOf(mapping);
    }

    private static void register(
        Map<String, MarkdownSection> mapping,
        MarkdownSection section,
        String... headings
    ) {
        for (String heading : headings) {
            mapping.put(heading, section);
        }
    }
}
