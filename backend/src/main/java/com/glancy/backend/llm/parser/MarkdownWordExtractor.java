package com.glancy.backend.llm.parser;

import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

final class MarkdownWordExtractor {

    private static final Pattern NUMBERED_LIST_PATTERN = Pattern.compile("^(\\d+)[\\.)]\\s*(.+)$");
    private static final Pattern KEY_VALUE_PATTERN = Pattern.compile(
        "^(?<key>[\\p{L}\\p{IsHan}\\s]+)[:：]\\s*(?<value>.+)$"
    );

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
                if (resolvedTerm == null || resolvedTerm.isBlank()) {
                    resolvedTerm = heading;
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
        return switch (normalized) {
            case "definition", "definitions", "meaning", "meanings", "释义", "解释", "含义" -> Section.DEFINITION;
            case "synonym", "synonyms", "同义词" -> Section.SYNONYMS;
            case "antonym", "antonyms", "反义词" -> Section.ANTONYMS;
            case "related", "relatedwords", "相关词", "相关词汇" -> Section.RELATED;
            case "variation", "variations", "变体", "变形", "词形" -> Section.VARIATIONS;
            case "phrase", "phrases", "常见词组", "词组" -> Section.PHRASES;
            case "example", "examples", "例句", "用法示例", "用例" -> Section.EXAMPLE;
            case "phonetic", "pronunciation", "音标", "发音" -> Section.PHONETIC;
            default -> Section.DEFINITION;
        };
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
}
