package com.glancy.backend.dto;

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
