package com.glancy.backend.service.word;

import com.glancy.backend.dto.WordPersonalizationContext;
import com.glancy.backend.dto.WordResponse;
import com.glancy.backend.entity.DictionaryFlavor;
import com.glancy.backend.entity.Language;
import com.glancy.backend.service.support.WordPersistenceContext;
import com.glancy.backend.service.support.WordPersistenceCoordinator;
import com.glancy.backend.service.support.WordPersistenceCoordinator.PersistenceOutcome;
import com.glancy.backend.service.support.WordVersionContentStrategy;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class WordPersistenceContextFactory {

    private final WordCacheManager cacheManager;
    private final SearchRecordCoordinator searchRecordCoordinator;
    private final SearchResultVersionWriter versionWriter;
    private final WordPersonalizationApplier personalizationApplier;

    public WordPersistenceContext create(WordPersistenceRequest request) {
        return WordPersistenceCoordinator.builder()
                .userId(request.userId())
                .requestedTerm(request.requestedTerm())
                .language(request.language())
                .flavor(request.flavor())
                .model(request.model())
                .recordId(request.recordId())
                .captureHistory(request.captureHistory())
                .response(request.response())
                .personalizationContext(request.personalizationContext())
                .saveWordStep(cacheManager::saveWord)
                .recordSynchronizationStep(searchRecordCoordinator::synchronizeRecordTermQuietly)
                .versionPersistStep(versionWriter::persistVersion)
                .personalizationStep(personalizationApplier::apply)
                .wordSerializationStep(cacheManager::serializeWord)
                .sanitizedMarkdown(request.sanitizedMarkdown())
                .build();
    }

    public PersistenceOutcome persist(
            WordPersistenceCoordinator coordinator,
            WordPersistenceRequest request,
            WordVersionContentStrategy strategy) {
        return coordinator.persist(create(request), strategy);
    }

    public record WordPersistenceRequest(
            Long userId,
            String requestedTerm,
            Language language,
            DictionaryFlavor flavor,
            String model,
            Long recordId,
            boolean captureHistory,
            WordResponse response,
            WordPersonalizationContext personalizationContext,
            String sanitizedMarkdown) {}
}
