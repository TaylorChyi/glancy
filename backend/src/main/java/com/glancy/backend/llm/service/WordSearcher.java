package com.glancy.backend.llm.service;

import com.glancy.backend.dto.word.WordPersonalizationContext;
import com.glancy.backend.dto.word.WordResponse;
import com.glancy.backend.entity.DictionaryFlavor;
import com.glancy.backend.entity.Language;
import reactor.core.publisher.Flux;

public interface WordSearcher {
    WordResponse search(
        String term,
        Language language,
        DictionaryFlavor flavor,
        String clientName,
        WordPersonalizationContext personalizationContext
    );

    Flux<String> streamSearch(
        String term,
        Language language,
        DictionaryFlavor flavor,
        String clientName,
        WordPersonalizationContext personalizationContext
    );
}
