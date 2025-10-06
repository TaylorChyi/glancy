package com.glancy.backend.dto;

import com.glancy.backend.entity.DictionaryFlavor;
import com.glancy.backend.entity.Language;
import com.glancy.backend.entity.WordIssueCategory;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * 背景：
 *  - 前端举报表单提交的数据需要结构化约束，确保服务层只接收合法字段。
 * 目的：
 *  - 通过 record 暴露不可变的输入模型，并结合 Bean Validation 做到即刻校验。
 * 关键决策与取舍：
 *  - 选用 record 减少样板代码，并让字段语义一目了然；
 *  - 描述字段限制在 2000 字符以内，避免异常长文本对数据库造成压力。
 */
public record WordIssueReportRequest(
    @NotBlank(message = "term is required") String term,
    @NotNull(message = "language is required") Language language,
    @NotNull(message = "flavor is required") DictionaryFlavor flavor,
    @NotNull(message = "category is required") WordIssueCategory category,
    @Size(max = 2000, message = "description is too long") String description,
    @Size(max = 500, message = "source url is too long") String sourceUrl
) {}
