package com.glancy.backend.dto;

import java.util.List;

/**
 * Aggregated progress summary for a Gomemo session.
 */
public record GomemoProgressSnapshotView(
    /** 已完成词汇数量 */ int completedWords,
    /** 计划词汇总数 */ int totalWords,
    /** 平均保留率 */ double retentionAverage,
    /** 细粒度练习记录 */ List<GomemoProgressDetailView> details
) {}
