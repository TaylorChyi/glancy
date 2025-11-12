package com.glancy.backend.llm.parser;

import java.util.ArrayList;
import java.util.EnumMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

final class MarkdownWordProcessor {

    private static final Pattern NUMBERED_LIST_PATTERN = Pattern.compile("^(\\d+)[\\.)]\\s*(.+)$");
    private static final Pattern KEY_VALUE_PATTERN = Pattern.compile(
        "^(?<key>[\\p{L}\\p{IsHan}\\s]+)[:：]\\s*(?<value>.+)$"
    );

    private final String[] lines;
    private final String fallbackTerm;
    private final MarkdownSectionResolver sectionResolver;
    private final EnumMap<MarkdownSection, SectionAppender> sectionAppenders;

    private MarkdownSection currentSection = MarkdownSection.DEFINITION;
    private boolean insideFence;
    private boolean headingResolvedTerm;
    private String resolvedTerm;
    private String example;
    private String phonetic;
    private String firstContentLine;

    private final Set<String> definitions = new LinkedHashSet<>();
    private final Set<String> synonyms = new LinkedHashSet<>();
    private final Set<String> antonyms = new LinkedHashSet<>();
    private final Set<String> related = new LinkedHashSet<>();
    private final Set<String> variations = new LinkedHashSet<>();
    private final Set<String> phrases = new LinkedHashSet<>();

    MarkdownWordProcessor(String markdown, String fallbackTerm, MarkdownSectionResolver sectionResolver) {
        this.lines = markdown.split("\\R");
        this.fallbackTerm = fallbackTerm;
        this.sectionResolver = sectionResolver;
        this.sectionAppenders = buildAppenders();
    }

    MarkdownWordSnapshot extract() {
        for (String rawLine : lines) {
            processLine(rawLine);
        }
        ensureFallbackDefinition();
        return buildSnapshot();
    }

    private void processLine(String rawLine) {
        String line = rawLine.trim();
        if (line.isEmpty()) {
            return;
        }
        if (toggleFence(line) || insideFence) {
            return;
        }
        if (handleHeading(line)) {
            return;
        }
        recordFirstContent(line);
        line = stripNumbering(line);
        if (handleListItem(line) || handleKeyValue(line) || handleSpecialSection(line)) {
            return;
        }
        appendToSection(line);
    }

    private boolean toggleFence(String line) {
        if (!line.startsWith("```")) {
            return false;
        }
        insideFence = !insideFence;
        return true;
    }

    private boolean handleHeading(String line) {
        if (!line.startsWith("#")) {
            return false;
        }
        String heading = line.replaceFirst("^#+", "").trim();
        if (heading.isEmpty()) {
            currentSection = MarkdownSection.DEFINITION;
            return true;
        }
        if (!headingResolvedTerm) {
            resolvedTerm = heading;
            headingResolvedTerm = true;
        }
        currentSection = sectionResolver.resolve(heading);
        return true;
    }

    private void recordFirstContent(String line) {
        if (firstContentLine == null) {
            firstContentLine = line;
        }
    }

    private String stripNumbering(String line) {
        Matcher matcher = NUMBERED_LIST_PATTERN.matcher(line);
        if (matcher.matches()) {
            return matcher.group(2).trim();
        }
        return line;
    }

    private boolean handleListItem(String line) {
        if (!line.startsWith("-") && !line.startsWith("*")) {
            return false;
        }
        String value = line.substring(1).trim();
        appendSectionValue(currentSection, value, false);
        return true;
    }

    private boolean handleKeyValue(String line) {
        Matcher matcher = KEY_VALUE_PATTERN.matcher(line);
        if (!matcher.matches()) {
            return false;
        }
        MarkdownSection section = sectionResolver.resolve(matcher.group("key").trim());
        appendSectionValue(section, matcher.group("value").trim(), true);
        return true;
    }

    private boolean handleSpecialSection(String line) {
        if (currentSection == MarkdownSection.EXAMPLE) {
            example = selectFirstNonBlank(example, line);
            return true;
        }
        if (currentSection == MarkdownSection.PHONETIC) {
            phonetic = selectFirstNonBlank(phonetic, line);
            return true;
        }
        return false;
    }

    private void appendToSection(String value) {
        appendSectionValue(currentSection, value, false);
    }

    private void appendSectionValue(MarkdownSection section, String value, boolean splitPhrases) {
        if (value == null || value.isBlank()) {
            return;
        }
        SectionAppender appender = sectionAppenders.get(section);
        if (appender != null) {
            appender.append(value, splitPhrases);
            return;
        }
        definitions.add(value);
    }

    private void ensureFallbackDefinition() {
        if (definitions.isEmpty() && firstContentLine != null) {
            definitions.add(firstContentLine);
        }
    }

    private MarkdownWordSnapshot buildSnapshot() {
        String term = resolvedTerm;
        if (!headingResolvedTerm && (term == null || term.isBlank())) {
            term = fallbackTerm;
        }
        if (term == null || term.isBlank()) {
            term = fallbackTerm;
        }
        return new MarkdownWordSnapshot(
            term,
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

    private static String selectFirstNonBlank(String current, String candidate) {
        if (current != null && !current.isBlank()) {
            return current;
        }
        if (candidate == null || candidate.isBlank()) {
            return current;
        }
        return candidate.trim();
    }

    private static List<String> splitList(String value) {
        if (value == null || value.isBlank()) {
            return List.of();
        }
        String[] parts = value.split("[，,;；]\\s*|、");
        List<String> result = new ArrayList<>();
        for (String part : parts) {
            String trimmed = part.trim();
            if (!trimmed.isEmpty()) {
                result.add(trimmed);
            }
        }
        if (result.isEmpty()) {
            return List.of(value.trim());
        }
        return result;
    }

    private EnumMap<MarkdownSection, SectionAppender> buildAppenders() {
        EnumMap<MarkdownSection, SectionAppender> mapping = new EnumMap<>(MarkdownSection.class);
        mapping.put(MarkdownSection.SYNONYMS, (value, split) -> synonyms.addAll(splitList(value)));
        mapping.put(MarkdownSection.ANTONYMS, (value, split) -> antonyms.addAll(splitList(value)));
        mapping.put(MarkdownSection.RELATED, (value, split) -> related.addAll(splitList(value)));
        mapping.put(MarkdownSection.VARIATIONS, (value, split) -> variations.addAll(splitList(value)));
        mapping.put(MarkdownSection.PHRASES, this::appendPhrase);
        mapping.put(MarkdownSection.EXAMPLE, (value, split) -> example = selectFirstNonBlank(example, value));
        mapping.put(MarkdownSection.PHONETIC, (value, split) -> phonetic = selectFirstNonBlank(phonetic, value));
        return mapping;
    }

    private void appendPhrase(String value, boolean splitPhrases) {
        if (splitPhrases) {
            phrases.addAll(splitList(value));
            return;
        }
        phrases.add(value);
    }

    @FunctionalInterface
    private interface SectionAppender {
        void append(String value, boolean splitPhrases);
    }
}
