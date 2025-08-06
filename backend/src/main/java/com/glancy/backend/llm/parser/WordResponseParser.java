package com.glancy.backend.llm.parser;

import com.glancy.backend.dto.WordResponse;
import com.glancy.backend.entity.Language;

public interface WordResponseParser {
    WordResponse parse(String content, String term, Language language);
}
