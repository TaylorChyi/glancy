package com.glancy.backend.dto;

import java.util.List;

/**
 * Persona projection returned to front-end clients.
 */
public record GomemoPersonaView(
    /** 学习者画像的整体描述 */ String descriptor,
    /** 建议对话对象描述，用于类比表达 */ String audience,
    /** 推荐语气 */ String tone,
    /** 每日目标词汇数，单位：个 */ Integer dailyTarget,
    /** 学习目标原文 */ String goal,
    /** 未来规划摘要 */ String futurePlan,
    /** 兴趣关键词列表 */ List<String> interests
) {}
