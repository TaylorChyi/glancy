package com.glancy.backend.llm.parser;

import com.glancy.backend.entity.Language;

/**
 * Parses LLM responses into domain objects while preserving the original markdown.
 */
public interface WordResponseParser {
    ParsedWord parse(String content, String term, Language language);
}
