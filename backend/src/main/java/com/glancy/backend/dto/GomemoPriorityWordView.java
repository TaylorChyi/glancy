package com.glancy.backend.dto;

import com.glancy.backend.entity.Language;
import com.glancy.backend.gomemo.model.GomemoStudyModeType;
import java.util.List;

/**
 * Prioritized vocabulary entry with supporting rationale.
 */
public record GomemoPriorityWordView(
    /** 词汇原文 */ String term,
    /** 词汇语种 */ Language language,
    /** 优先级分值 */ int priority,
    /** 优先级提示文本 */ List<String> rationales,
    /** 建议练习模式 */ List<GomemoStudyModeType> recommendedModes
) {}
