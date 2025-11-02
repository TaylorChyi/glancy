/**
 * 背景：
 *  - 搜索结果版本摘要与其他领域 DTO 并列，历史版本语义模糊。
 * 目的：
 *  - 在 search 包集中维护搜索结果版本摘要，配合搜索历史响应使用。
 * 关键决策与取舍：
 *  - 维持 record 结构，必要时可添加更多摘要字段；通过包划分强化词典领域。
 * 影响范围：
 *  - 搜索历史相关服务导入路径更新。
 * 演进与TODO：
 *  - 若未来需要差异化摘要，可扩展 preview 结构或新增类型字段。
 */
package com.glancy.backend.dto.search;

import com.glancy.backend.entity.DictionaryFlavor;
import java.time.LocalDateTime;

/**
 * Lightweight summary of a persisted search result version for a search term.
 */
public record SearchRecordVersionSummary(
    Long id,
    Integer versionNumber,
    LocalDateTime createdAt,
    String model,
    String preview,
    DictionaryFlavor flavor
) {}
