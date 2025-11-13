package com.glancy.backend.dto;

public record ProfileCustomSectionItemDto(
        /** 自定义小项的人类可读标签 */
        String label,
        /** 用户填写的具体内容 */
        String value) {}
