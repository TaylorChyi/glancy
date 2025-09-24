package com.glancy.backend.llm.service;

import com.glancy.backend.dto.WordPersonalizationContext;
import com.glancy.backend.dto.WordResponse;
import com.glancy.backend.entity.Language;
import reactor.core.publisher.Flux;

public interface WordSearcher {
    WordResponse search(
        String term,
        Language language,
        String clientName,
        WordPersonalizationContext personalizationContext
    );

    Flux<String> streamSearch(
        String term,
        Language language,
        String clientName,
        WordPersonalizationContext personalizationContext
    );
}
