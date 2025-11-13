package com.glancy.backend.llm.parser;

import com.fasterxml.jackson.databind.JsonNode;

final class JsonExampleResolver {

    private final JsonNode node;

    JsonExampleResolver(JsonNode node) {
        this.node = node;
    }

    String resolve() {
        return firstNonBlank(explicitExample(), exampleFromDefinitions(), exampleFromChineseSections());
    }

    private String explicitExample() {
        return textOrNull(node.path("example"));
    }

    private String exampleFromDefinitions() {
        JsonNode defsNode = node.path("definitions");
        if (!defsNode.isArray()) {
            return null;
        }
        for (JsonNode definition : defsNode) {
            JsonNode examples = definition.path("examples");
            if (examples.isArray() && examples.size() > 0) {
                JsonNode first = examples.get(0);
                if (first.isTextual()) {
                    return first.asText();
                }
            }
        }
        return null;
    }

    private String exampleFromChineseSections() {
        JsonNode explainNode = node.path("\u53D1\u97F3\u89E3\u91CA");
        if (!explainNode.isArray()) {
            return null;
        }
        for (JsonNode explanation : explainNode) {
            JsonNode definitions = explanation.path("\u91CA\u4E49");
            if (!definitions.isArray()) {
                continue;
            }
            for (JsonNode definition : definitions) {
                String example = firstChineseExample(definition);
                if (example != null) {
                    return example;
                }
            }
        }
        return null;
    }

    private String firstChineseExample(JsonNode definition) {
        JsonNode sentences = definition.path("\u4F8B\u53E5");
        if (!sentences.isArray() || sentences.size() == 0) {
            return null;
        }
        JsonNode first = sentences.get(0);
        if (first.has("\u6E90\u8BED\u8A00")) {
            return textOrNull(first.path("\u6E90\u8BED\u8A00"));
        }
        return first.isTextual() ? first.asText() : null;
    }

    private static String firstNonBlank(String... candidates) {
        for (String candidate : candidates) {
            if (candidate != null && !candidate.isBlank()) {
                return candidate;
            }
        }
        return null;
    }

    private static String textOrNull(JsonNode candidate) {
        return candidate.isMissingNode() || candidate.isNull() ? null : candidate.asText();
    }
}
