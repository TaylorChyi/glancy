package com.glancy.backend.service.support;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.glancy.backend.dto.word.WordResponse;
import com.glancy.backend.entity.Word;
import com.glancy.backend.util.SensitiveDataUtil;
import lombok.extern.slf4j.Slf4j;

/**
 * 背景：
 *  - 同步查询场景下模型通常直接返回 markdown，历史版本希望复用该内容以保持一致展示。\
 * 目的：
 *  - 首选响应中的 markdown，若缺失则序列化完整词条作为兜底。\
 * 关键决策与取舍：
 *  - 优先复用响应可避免重复序列化；\
 *  - 回退到序列化而非放弃持久化，确保历史记录仍可查看，代价是遇到序列化异常时只能保存预览文本。\
 * 影响范围：
 *  - 默认同步查询路径选用该策略；\
 *  - 通过上下文暴露的序列化函数可替换为不同格式（如 YAML）。
 * 演进与TODO：
 *  - 若未来需要多语言 markdown，可在此策略内注入转换组件。\
 *  - 可扩展异常分类上报以监控序列化失败率。
 */
@Slf4j
public class ResponseMarkdownOrSerializedWordStrategy implements WordVersionContentStrategy {

    @Override
    public String resolveContent(WordPersistenceCoordinator.PersistenceContext context, Word savedWord) {
        WordResponse response = context.response();
        if (response != null && response.getMarkdown() != null && !response.getMarkdown().isBlank()) {
            return response.getMarkdown();
        }
        try {
            return context.serializeWord(savedWord);
        } catch (JsonProcessingException e) {
            log.warn(
                "Failed to serialize word '{}' for version content: {}",
                savedWord.getTerm(),
                e.getOriginalMessage(),
                e
            );
            return SensitiveDataUtil.previewText(savedWord.getMarkdown());
        }
    }
}
