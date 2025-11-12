package com.glancy.backend.llm.parser;

import java.util.List;

record MarkdownWordSnapshot(
    String term,
    List<String> definitions,
    List<String> synonyms,
    List<String> antonyms,
    List<String> related,
    List<String> variations,
    List<String> phrases,
    String example,
    String phonetic
) {
    static MarkdownWordSnapshot empty(String fallbackTerm) {
        List<String> empty = List.of();
        return new MarkdownWordSnapshot(fallbackTerm, empty, empty, empty, empty, empty, empty, null, null);
    }
}
