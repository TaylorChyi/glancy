package com.glancy.backend.llm.service;

import com.glancy.backend.dto.WordPersonalizationContext;
import com.glancy.backend.dto.WordResponse;
import com.glancy.backend.entity.DictionaryFlavor;
import com.glancy.backend.entity.Language;

public interface WordSearcher {
    WordResponse search(
            String term,
            Language language,
            DictionaryFlavor flavor,
            String clientName,
            WordPersonalizationContext personalizationContext);
}
