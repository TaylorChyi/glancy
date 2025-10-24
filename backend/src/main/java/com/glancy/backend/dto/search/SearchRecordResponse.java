/**
 * 背景：
 *  - 搜索记录响应与聊天、用户 DTO 并列，难以突出搜索历史语义。
 * 目的：
 *  - 在 search 包集中展示搜索历史返回体，支撑词典浏览场景。
 * 关键决策与取舍：
 *  - 继续使用 record 并防御性拷贝版本列表；包划分防止与其他历史对象混淆。
 * 影响范围：
 *  - 搜索历史 API 导入路径更新。
 * 演进与TODO：
 *  - 若后续需要分页版本，可在本包新增轻量摘要模型。
 */
package com.glancy.backend.dto.search;

import com.glancy.backend.entity.DictionaryFlavor;
import com.glancy.backend.entity.Language;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Represents a saved search history item returned to the client.
 */
public record SearchRecordResponse(
    Long id,
    Long userId,
    String term,
    Language language,
    DictionaryFlavor flavor,
    LocalDateTime createdAt,
    Boolean favorite,
    SearchRecordVersionSummary latestVersion,
    List<SearchRecordVersionSummary> versions
) {
    public SearchRecordResponse {
        versions = versions == null ? List.of() : List.copyOf(versions);
    }

    public SearchRecordResponse withVersionDetails(
        SearchRecordVersionSummary latest,
        List<SearchRecordVersionSummary> versionSummaries
    ) {
        return new SearchRecordResponse(
            id,
            userId,
            term,
            language,
            flavor,
            createdAt,
            favorite,
            latest,
            versionSummaries == null ? List.of() : List.copyOf(versionSummaries)
        );
    }
}
