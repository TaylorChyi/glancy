package com.glancy.backend.dto;

import com.glancy.backend.gomemo.model.GomemoStudyModeType;

/**
 * Study mode descriptor transmitted to clients.
 */
public record GomemoStudyModeView(
    /** 模式类型 */ GomemoStudyModeType type,
    /** 展示标题 */ String title,
    /** 模式简介 */ String description,
    /** 练习时的专注点提示 */ String focus
) {}
