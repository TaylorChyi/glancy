package com.glancy.backend.service;

import com.glancy.backend.dto.WordPersonalizationContext;
import com.glancy.backend.dto.WordResponse;
import com.glancy.backend.entity.DictionaryFlavor;
import com.glancy.backend.entity.DictionaryModel;
import com.glancy.backend.entity.Language;
import com.glancy.backend.service.personalization.WordPersonalizationService;
import com.glancy.backend.service.support.DictionaryTermNormalizer;
import com.glancy.backend.service.word.StreamingWordRetrievalStrategy;
import com.glancy.backend.service.word.SynchronousWordRetrievalStrategy;
import com.glancy.backend.service.word.WordQueryContext;
import com.glancy.backend.service.word.WordRetrievalStrategy;
import com.glancy.backend.service.word.WordStreamPayload;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import reactor.core.publisher.Flux;

/**
 * 背景：
 *  - 原 WordService 混合同步/流式查词流程，导致类体超过 600 行，维护成本极高。\
 * 目的：
 *  - 通过策略模式拆分查词流程，WordService 仅负责上下文构造与依赖编排。\
 * 关键决策与取舍：
 *  - 采用 `WordRetrievalStrategy` 抽象同步与流式两种流程，避免一次性补丁；\
 *  - WordService 聚焦于“准备上下文 + 调用策略”，保持可扩展与可测试。\
 * 影响范围：
 *  - 对外 API 保持不变，但内部依赖拆分为多个可组合组件。\
 * 演进与TODO：
 *  - 可进一步抽象模型选择逻辑，引入配置化策略或灰度模型。
 */
@Slf4j
@Service
public class WordService {

    private static final String DEFAULT_MODEL = DictionaryModel.DOUBAO.getClientName();

    private final DictionaryTermNormalizer termNormalizer;
    private final WordPersonalizationService wordPersonalizationService;
    private final WordRetrievalStrategy<WordResponse> synchronousStrategy;
    private final WordRetrievalStrategy<Flux<WordStreamPayload>> streamingStrategy;

    public WordService(
        DictionaryTermNormalizer termNormalizer,
        WordPersonalizationService wordPersonalizationService,
        SynchronousWordRetrievalStrategy synchronousStrategy,
        StreamingWordRetrievalStrategy streamingStrategy
    ) {
        this.termNormalizer = termNormalizer;
        this.wordPersonalizationService = wordPersonalizationService;
        this.synchronousStrategy = synchronousStrategy;
        this.streamingStrategy = streamingStrategy;
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

    @Transactional
    public Flux<WordStreamPayload> streamWordForUser(
        Long userId,
        String term,
        Language language,
        DictionaryFlavor flavor,
        String model,
        boolean forceNew,
        boolean captureHistory
    ) {
        WordQueryContext context = buildContext(userId, term, language, flavor, model, forceNew, captureHistory);
        return streamingStrategy.execute(context);
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
