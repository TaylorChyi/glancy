package com.glancy.backend.service.support;

import com.glancy.backend.entity.Word;
import lombok.extern.slf4j.Slf4j;

/**
 * 背景：
 *  - 流式响应在聚合后会产出净化 markdown，更贴近用户最终看到的内容。\
 * 目的：
 *  - 在流式场景下使用聚合后的净化 markdown 作为历史版本内容。\
 * 关键决策与取舍：
 *  - 直接依赖上下文提供的净化文本，避免重复解析；\
 *  - 当净化文本缺失时回退到词条自带 markdown，取舍是日志中需提示潜在模型异常。\
 * 影响范围：
 *  - finalizeStreamingSession 调用该策略；\
 *  - 若未来引入多段摘要，可在上下文扩展更多字段。
 * 演进与TODO：
 *  - 可在净化文本缺失时触发告警链路；\
 *  - 支持根据用户偏好选择原始流或净化版本。
 */
@Slf4j
public class SanitizedStreamingMarkdownStrategy implements WordVersionContentStrategy {

    @Override
    public String resolveContent(WordPersistenceCoordinator.PersistenceContext context, Word savedWord) {
        String sanitized = context.sanitizedMarkdown();
        if (sanitized == null || sanitized.isBlank()) {
            log.warn(
                "Sanitized markdown missing for term '{}', falling back to persisted markdown",
                savedWord.getTerm()
            );
            return savedWord.getMarkdown();
        }
        return sanitized;
    }
}
