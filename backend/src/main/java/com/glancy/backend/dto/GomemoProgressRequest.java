package com.glancy.backend.dto;

import com.glancy.backend.entity.Language;
import com.glancy.backend.gomemo.model.GomemoStudyModeType;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;

/**
 * Request body for recording Gomemo practice progress.
 */
public record GomemoProgressRequest(
    /** 词汇原文 */ @NotBlank String term,
    /** 词汇语种 */ @NotNull Language language,
    /** 对应模式 */ @NotNull GomemoStudyModeType mode,
    /** 尝试次数 */ @Positive int attempts,
    /** 成功次数 */ @PositiveOrZero int successes,
    /** 记忆得分，0-100 */ @Min(0) @Max(100) int retentionScore,
    /** 额外备注 */ String note
) {}
