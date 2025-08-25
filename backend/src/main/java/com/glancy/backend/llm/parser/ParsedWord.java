package com.glancy.backend.llm.parser;

import com.glancy.backend.dto.WordResponse;

/**
 * Wrapper for a parsed word response alongside the original markdown text.
 */
public record ParsedWord(WordResponse parsed, String markdown) {}
