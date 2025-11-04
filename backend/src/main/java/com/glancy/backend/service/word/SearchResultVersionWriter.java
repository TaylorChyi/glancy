package com.glancy.backend.service.word;

import com.glancy.backend.entity.DictionaryFlavor;
import com.glancy.backend.entity.Language;
import com.glancy.backend.entity.SearchResultVersion;
import com.glancy.backend.entity.Word;
import com.glancy.backend.service.SearchResultService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

/**
 * 背景：
 *  - WordService 直接拼接调用 SearchResultService，缺乏抽象导致持久化逻辑难以复用。\
 * 目的：
 *  - 为版本写入提供语义化门面，便于在不同策略中共享实现并扩展监控。\
 * 关键决策与取舍：
 *  - 保持纯粹的委派角色，不引入缓存或重试以免扩大职责。\
 * 影响范围：
 *  - 持久化上下文通过该组件写入搜索结果版本。\
 * 演进与TODO：
 *  - 后续可在此增加指标或审计日志。
 */
@Component
@RequiredArgsConstructor
public class SearchResultVersionWriter {

    private final SearchResultService searchResultService;

    public SearchResultVersion persistVersion(
        Long recordId,
        Long userId,
        String model,
        String content,
        Word word,
        DictionaryFlavor flavor
    ) {
        if (recordId == null) {
            return null;
        }
        return searchResultService.createVersion(
            recordId,
            userId,
            word.getTerm(),
            word.getLanguage(),
            model,
            content,
            word,
            flavor
        );
    }
}
