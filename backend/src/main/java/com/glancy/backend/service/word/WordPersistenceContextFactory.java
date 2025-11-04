package com.glancy.backend.service.word;

import com.glancy.backend.dto.WordPersonalizationContext;
import com.glancy.backend.dto.WordResponse;
import com.glancy.backend.entity.DictionaryFlavor;
import com.glancy.backend.entity.Language;
import com.glancy.backend.service.support.WordPersistenceCoordinator;
import com.glancy.backend.service.support.WordPersistenceCoordinator.PersistenceContext;
import com.glancy.backend.service.support.WordPersistenceCoordinator.PersistenceOutcome;
import com.glancy.backend.service.support.WordVersionContentStrategy;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

/**
 * 背景：
 *  - WordService 需要为持久化协调器准备大量回调，构造代码冗长且重复。\
 * 目的：
 *  - 提供集中工厂负责组装 {@link PersistenceContext}，确保各策略共享一致的流程骨架。\
 * 关键决策与取舍：
 *  - 工厂仅关注上下文构建，实际执行仍交由 `WordPersistenceCoordinator`，保持职责单一；\
 *  - 引入请求对象 {@link WordPersistenceRequest} 以避免构造函数参数爆炸。\
 * 影响范围：
 *  - 查词策略通过该工厂获取持久化上下文并执行协调器。\
 * 演进与TODO：
 *  - 若后续需要指标或审计，可在此处统一注入。
 */
@Component
@RequiredArgsConstructor
public class WordPersistenceContextFactory {

    private final WordCacheManager cacheManager;
    private final SearchRecordCoordinator searchRecordCoordinator;
    private final SearchResultVersionWriter versionWriter;
    private final WordPersonalizationApplier personalizationApplier;

    public PersistenceContext create(WordPersistenceRequest request) {
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
        WordVersionContentStrategy strategy
    ) {
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
        String sanitizedMarkdown
    ) {}
}
