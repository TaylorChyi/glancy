package com.glancy.backend.service.word;

import com.glancy.backend.dto.WordPersonalizationContext;
import com.glancy.backend.entity.DictionaryFlavor;
import com.glancy.backend.entity.Language;

public record WordQueryContext(
    Long userId,
    String rawTerm,
    String normalizedTerm,
    Language language,
    DictionaryFlavor flavor,
    String model,
    boolean forceNew,
    boolean captureHistory,
    WordPersonalizationContext personalizationContext
) {}
