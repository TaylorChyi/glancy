/**
 * 背景：
 *  - 举报响应此前与其他 DTO 混放，词汇治理结果难以聚焦。
 * 目的：
 *  - 在 word 包提供最小必要的举报响应体，包含标识与提交时间。
 * 关键决策与取舍：
 *  - 保持 record 不可变性且不暴露内部删除状态，确保语义简洁。
 * 影响范围：
 *  - WordIssueReportController 的导入路径更新。
 * 演进与TODO：
 *  - 若需返回处理状态，可在本包扩展字段。
 */
package com.glancy.backend.dto.word;

import com.glancy.backend.entity.DictionaryFlavor;
import com.glancy.backend.entity.Language;
import com.glancy.backend.entity.WordIssueCategory;
import java.time.LocalDateTime;

/**
 * 背景：
 *  - 举报提交后需要向前端回传确认信息，以便展示反馈或排错。
 * 目的：
 *  - 提供最小必要的响应体，包括标识、词条信息与提交时间。
 * 关键决策与取舍：
 *  - 不直接暴露内部 deleted 字段，保持响应语义简洁；
 *  - 使用 record 以保持不可变并配合 JSON 序列化。
 */
public record WordIssueReportResponse(
    Long id,
    String term,
    Language language,
    DictionaryFlavor flavor,
    WordIssueCategory category,
    String description,
    String sourceUrl,
    LocalDateTime createdAt
) {}
