/**
 * 背景：
 *  - 举报词条问题需要结构化记录具体问题类别，便于后续做统计分析与优先级管理。
 * 目的：
 *  - 以枚举形式声明受支持的问题分类，保证前后端在类别取值上的契约一致。
 * 关键决策与取舍：
 *  - 枚举命名采用业务语义词汇，避免简单数字编码造成语义丢失；
 *  - 预留 OTHER 选项，使系统在未来扩展新类型前仍可承载未知问题。
 * 影响范围：
 *  - WordIssueReport 实体及其 DTO；
 * 演进与TODO：
 *  - 如需支持动态配置类别，可引入数据库驱动或配置中心并在此枚举上提供映射策略。
 */
package com.glancy.backend.entity;

public enum WordIssueCategory {
    INCORRECT_MEANING,
    MISSING_INFORMATION,
    INAPPROPRIATE_CONTENT,
    OTHER,
}
