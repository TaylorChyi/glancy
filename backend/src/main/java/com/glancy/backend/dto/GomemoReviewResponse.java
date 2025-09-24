package com.glancy.backend.dto;

/**
 * Response returned after completing a Gomemo session with LLM review.
 */
public record GomemoReviewResponse(
    /** 豆包生成的复盘文本 */ String review,
    /** 下一阶段学习建议 */ String nextFocus,
    /** 最终进度快照 */ GomemoProgressSnapshotView progress
) {}
