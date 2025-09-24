package com.glancy.backend.dto;

import com.glancy.backend.gomemo.model.GomemoStudyModeType;

/**
 * Snapshot of per-word progress.
 */
public record GomemoProgressDetailView(
    /** 对应词汇 */ String term,
    /** 所属模式 */ GomemoStudyModeType mode,
    /** 总尝试次数 */ int attempts,
    /** 保留率得分 */ double retentionScore
) {}
