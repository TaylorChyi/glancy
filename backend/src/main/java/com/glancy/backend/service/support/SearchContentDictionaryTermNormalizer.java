package com.glancy.backend.service.support;

import com.glancy.backend.llm.search.SearchContentManager;
import org.springframework.stereotype.Component;

/**
 * 背景：
 *  - 现有 SearchContentManager 已在 LLM 入口承担词条归一化职责，但服务层无法复用，导致缓存命中依赖不一致的键。
 * 目的：
 *  - 通过轻量适配器复用既有归一化策略，使 WordService 能在持久化和读取阶段得到一致的键格式。
 * 关键决策与取舍：
 *  - 采用适配器模式封装 SearchContentManager，避免直接暴露 LLM 细节给服务层；若未来需要差异化策略，可并存多实现并通过配置装配。
 * 影响范围：
 *  - 所有依赖 DictionaryTermNormalizer 的调用方将通过该适配器共享一套规范化逻辑。
 * 演进与TODO：
 *  - 如需按语言扩展不同策略，可引入策略工厂或责任链选择适配器。
 */
@Component
public class SearchContentDictionaryTermNormalizer implements DictionaryTermNormalizer {

    private final SearchContentManager searchContentManager;

    public SearchContentDictionaryTermNormalizer(SearchContentManager searchContentManager) {
        this.searchContentManager = searchContentManager;
    }

    @Override
    public String normalize(String term) {
        return searchContentManager.normalize(term);
    }
}
