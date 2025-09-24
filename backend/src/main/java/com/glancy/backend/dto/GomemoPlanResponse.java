package com.glancy.backend.dto;

import java.util.List;

/**
 * Response payload describing the curated Gomemo plan for the user.
 */
public record GomemoPlanResponse(
    /** 会话标识 */ Long sessionId,
    /** 会话日期（ISO-8601） */ String sessionDate,
    /** 用户画像投影 */ GomemoPersonaView persona,
    /** 计划生成依据摘要 */ List<String> planHighlights,
    /** 高优先级词汇列表 */ List<GomemoPriorityWordView> words,
    /** 可用练习模式 */ List<GomemoStudyModeView> modes,
    /** 进度快照 */ GomemoProgressSnapshotView progress
) {}
