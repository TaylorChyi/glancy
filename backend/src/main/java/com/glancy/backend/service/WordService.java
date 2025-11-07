package com.glancy.backend.service;

import com.glancy.backend.dto.WordPersonalizationContext;
import com.glancy.backend.dto.WordResponse;
import com.glancy.backend.entity.DictionaryFlavor;
import com.glancy.backend.entity.DictionaryModel;
import com.glancy.backend.entity.Language;
import com.glancy.backend.service.personalization.WordPersonalizationService;
import com.glancy.backend.service.support.DictionaryTermNormalizer;
import com.glancy.backend.service.word.SynchronousWordRetrievalStrategy;
import com.glancy.backend.service.word.WordQueryContext;
import com.glancy.backend.service.word.WordRetrievalStrategy;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
public class WordService {

    private static final String DEFAULT_MODEL = DictionaryModel.DOUBAO.getClientName();

    private final DictionaryTermNormalizer termNormalizer;
    private final WordPersonalizationService wordPersonalizationService;
    private final WordRetrievalStrategy<WordResponse> synchronousStrategy;

    public WordService(
        DictionaryTermNormalizer termNormalizer,
        WordPersonalizationService wordPersonalizationService,
        SynchronousWordRetrievalStrategy synchronousStrategy
    ) {
        this.termNormalizer = termNormalizer;
        this.wordPersonalizationService = wordPersonalizationService;
        this.synchronousStrategy = synchronousStrategy;
    }

    @Transactional
    public WordResponse findWordForUser(
        Long userId,
        String term,
        Language language,
        DictionaryFlavor flavor,
        String model,
        boolean forceNew,
        boolean captureHistory
    ) {
        WordQueryContext context = buildContext(userId, term, language, flavor, model, forceNew, captureHistory);
        return synchronousStrategy.execute(context);
    }

    private WordQueryContext buildContext(
        Long userId,
        String term,
        Language language,
        DictionaryFlavor flavor,
        String requestedModel,
        boolean forceNew,
        boolean captureHistory
    ) {
        String normalizedTerm = termNormalizer.normalize(term);
        String model = resolveModelName(requestedModel);
        WordPersonalizationContext personalizationContext = resolvePersonalization(userId);
        log.info(
            "Building word query context for user {} term '{}' (normalized '{}') language {} flavor {} model {}",
            userId,
            term,
            normalizedTerm,
            language,
            flavor,
            model
        );
        return new WordQueryContext(
            userId,
            term,
            normalizedTerm,
            language,
            flavor,
            model,
            forceNew,
            captureHistory,
            personalizationContext
        );
    }

    private WordPersonalizationContext resolvePersonalization(Long userId) {
        return wordPersonalizationService.resolveContext(userId);
    }

    private String resolveModelName(String requestedModel) {
        if (requestedModel != null) {
            String trimmed = requestedModel.trim();
            if (!trimmed.isEmpty()) {
                if (
                    trimmed.equalsIgnoreCase(DictionaryModel.DOUBAO.name()) || trimmed.equalsIgnoreCase(DEFAULT_MODEL)
                ) {
                    return DEFAULT_MODEL;
                }
                log.warn("Unsupported dictionary model '{}' requested, defaulting to {}", trimmed, DEFAULT_MODEL);
            }
        }
        return DEFAULT_MODEL;
    }
}
