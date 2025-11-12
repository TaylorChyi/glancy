package com.glancy.backend.llm.parser;

import com.fasterxml.jackson.databind.JsonNode;
import com.glancy.backend.dto.WordResponse;
import com.glancy.backend.entity.Language;
import java.util.ArrayList;
import java.util.List;

final class JsonWordPayload {

    private final JsonNode node;

    private JsonWordPayload(JsonNode node) {
        this.node = node;
    }

    static ParsedWord build(JsonNode node, String fallbackTerm, Language fallbackLanguage, String markdown) {
        return new JsonWordPayload(node).toParsedWord(fallbackTerm, fallbackLanguage, markdown);
    }

    private ParsedWord toParsedWord(String fallbackTerm, Language fallbackLanguage, String markdown) {
        List<String> synonyms = new ArrayList<>();
        List<String> antonyms = new ArrayList<>();
        List<String> related = new ArrayList<>();
        List<String> definitions = resolveDefinitions(synonyms, antonyms, related);

        WordResponse response = new WordResponse(
            resolveId(),
            resolveTerm(fallbackTerm),
            definitions,
            resolveLanguage(fallbackLanguage),
            new JsonExampleResolver(node).resolve(),
            new JsonPhoneticResolver(node).resolve(),
            collectVariations(),
            synonyms,
            antonyms,
            related,
            collectPhrases(),
            markdown,
            null,
            null,
            null
        );
        return new ParsedWord(response, markdown);
    }

    private String resolveId() {
        JsonNode idNode = node.path("id");
        return idNode.isNull() ? null : idNode.asText();
    }

    private String resolveTerm(String fallbackTerm) {
        String term = firstNonBlank(
            textOrNull(node.path("term")),
            textOrNull(node.path("entry")),
            textOrNull(node.path("\u8BCD\u6761"))
        );
        return isBlank(term) ? fallbackTerm : term;
    }

    private Language resolveLanguage(Language fallbackLanguage) {
        String candidate = firstNonBlank(textOrNull(node.path("language")), textOrNull(node.path("\u8BED\u8A00")));
        if (isBlank(candidate)) {
            return fallbackLanguage;
        }
        String upper = candidate.toUpperCase();
        if (upper.contains("CHINESE")) {
            return Language.CHINESE;
        }
        if (upper.contains("ENGLISH")) {
            return Language.ENGLISH;
        }
        try {
            return Language.valueOf(upper);
        } catch (Exception ignored) {
            return fallbackLanguage;
        }
    }

    private List<String> resolveDefinitions(List<String> synonyms, List<String> antonyms, List<String> related) {
        List<String> definitions = collectEnglishDefinitions(synonyms, antonyms, related);
        if (!definitions.isEmpty()) {
            return definitions;
        }
        return collectChineseDefinitions(synonyms, antonyms, related);
    }

    private List<String> collectEnglishDefinitions(List<String> synonyms, List<String> antonyms, List<String> related) {
        List<String> definitions = new ArrayList<>();
        JsonNode defsNode = node.path("definitions");
        if (defsNode.isArray()) {
            defsNode.forEach(definition -> {
                List<String> meanings = collectMeanings(definition);
                if (!meanings.isEmpty()) {
                    String part = definition.path("partOfSpeech").asText();
                    String combined = String.join("; ", meanings);
                    definitions.add(part.isEmpty() ? combined : part + ": " + combined);
                }
                addTexts(definition, "synonyms", synonyms);
                addTexts(definition, "antonyms", antonyms);
                addTexts(definition, "related", related);
            });
        } else if (defsNode.isTextual()) {
            definitions.add(defsNode.asText());
        }
        return definitions;
    }

    private List<String> collectMeanings(JsonNode definition) {
        List<String> meanings = new ArrayList<>();
        JsonNode meaningsNode = definition.path("meanings");
        if (meaningsNode.isArray()) {
            meaningsNode.forEach(m -> meanings.add(m.asText()));
        } else if (definition.has("definition")) {
            meanings.add(definition.path("definition").asText());
        }
        return meanings;
    }

    private List<String> collectChineseDefinitions(List<String> synonyms, List<String> antonyms, List<String> related) {
        List<String> definitions = new ArrayList<>();
        JsonNode explainNode = node.path("\u53D1\u97F3\u89E3\u91CA");
        if (!explainNode.isArray()) {
            return definitions;
        }
        for (JsonNode explanation : explainNode) {
            JsonNode defList = explanation.path("\u91CA\u4E49");
            if (!defList.isArray()) {
                continue;
            }
            for (JsonNode definition : defList) {
                appendChineseDefinition(definition, definitions, synonyms, antonyms, related);
            }
        }
        return definitions;
    }

    private void appendChineseDefinition(
        JsonNode definition,
        List<String> definitions,
        List<String> synonyms,
        List<String> antonyms,
        List<String> related
    ) {
        String body = definition.path("\u5B9A\u4E49").asText();
        String part = definition.path("\u7C7B\u522B").asText();
        String combined = part.isEmpty() ? body : part + ": " + body;
        if (!combined.isEmpty()) {
            definitions.add(combined);
        }
        JsonNode relation = definition.path("\u5173\u7CFB\u8BCD");
        if (relation.isObject()) {
            addTexts(relation, "\u540C\u4E49\u8BCD", synonyms);
            addTexts(relation, "\u53CD\u4E49\u8BCD", antonyms);
            addTexts(relation, "\u76F8\u5173\u8BCD", related);
        }
    }

    private List<String> collectVariations() {
        List<String> variations = new ArrayList<>();
        JsonNode formsNode = node.path("\u53D8\u5F62");
        if (!formsNode.isArray()) {
            return variations;
        }
        for (JsonNode form : formsNode) {
            String state = form.path("\u72B6\u6001").asText();
            String word = form.path("\u8BCD\u5F62").asText();
            if (!word.isEmpty()) {
                variations.add(state.isEmpty() ? word : state + ": " + word);
            }
        }
        return variations;
    }

    private List<String> collectPhrases() {
        List<String> phrases = new ArrayList<>();
        JsonNode arr = node.path("\u5E38\u89C1\u8BCD\u7EC4");
        if (!arr.isArray()) {
            return phrases;
        }
        arr.forEach(item -> {
            if (item.isTextual()) {
                phrases.add(item.asText());
            }
        });
        return phrases;
    }

    private static void addTexts(JsonNode parent, String field, List<String> target) {
        JsonNode arr = parent.path(field);
        if (!arr.isArray()) {
            return;
        }
        arr.forEach(value -> {
            if (value.isTextual()) {
                target.add(value.asText());
            }
        });
    }

    private static String firstNonBlank(String... values) {
        for (String value : values) {
            if (!isBlank(value)) {
                return value;
            }
        }
        return null;
    }

    private static boolean isBlank(String value) {
        return value == null || value.isBlank();
    }

    private static String textOrNull(JsonNode candidate) {
        return candidate.isMissingNode() || candidate.isNull() ? null : candidate.asText();
    }
}
