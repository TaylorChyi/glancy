package com.glancy.backend.llm.parser;

import com.fasterxml.jackson.databind.JsonNode;

final class JsonPhoneticResolver {

    private final JsonNode node;

    JsonPhoneticResolver(JsonNode node) {
        this.node = node;
    }

    String resolve() {
        return firstNonBlank(
            textOrNull(node.path("phonetic")),
            phoneticFromPronunciations(),
            phoneticFromChineseNode()
        );
    }

    private String phoneticFromPronunciations() {
        JsonNode pronNode = node.path("pronunciations");
        if (!pronNode.isObject()) {
            return null;
        }
        var fieldNames = pronNode.fieldNames();
        while (fieldNames.hasNext()) {
            String key = fieldNames.next();
            JsonNode value = pronNode.path(key);
            if (!value.isMissingNode() && !value.isNull()) {
                return value.asText();
            }
        }
        return null;
    }

    private String phoneticFromChineseNode() {
        JsonNode pNode = node.path("\u53D1\u97F3");
        if (!pNode.isObject()) {
            return null;
        }
        if (pNode.has("\u82F1\u97F3")) {
            return pNode.path("\u82F1\u97F3").asText();
        }
        if (pNode.has("\u7F8E\u97F3")) {
            return pNode.path("\u7F8E\u97F3").asText();
        }
        return null;
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
