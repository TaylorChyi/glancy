package com.glancy.backend.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * 背景：
 *  - 用户举报词条问题需要可靠的持久化载体，以支撑后续的人工审核与自动统计。
 * 目的：
 *  - 以领域实体形式承载举报数据，复用 BaseEntity 的审计字段，统一管理生命周期状态。
 * 关键决策与取舍：
 *  - 采用字符串存储 term/language/flavor，避免强制依赖 Word 实体以降低耦合；
 *  - 引入 sourceUrl 与 userId 以保留追踪上下文，便于安全审计与客服回溯。
 * 影响范围：
 *  - 新增 word_issue_reports 表以及关联的仓储、服务层逻辑。
 * 演进与TODO：
 *  - 后续可根据审核流程扩展状态字段（如 processedAt、resolution），并引入审计记录表。
 */
@Entity
@Table(name = "word_issue_reports")
@Getter
@Setter
@NoArgsConstructor
public class WordIssueReport extends BaseEntity {

    @Column(nullable = false, length = 120)
    private String term;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    private Language language;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    private DictionaryFlavor flavor;

    @Enumerated(EnumType.STRING)
    @Column(name = "issue_category", nullable = false, length = 40)
    private WordIssueCategory category;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "source_url", length = 500)
    private String sourceUrl;

    @Column(name = "report_user_id")
    private Long userId;
}
