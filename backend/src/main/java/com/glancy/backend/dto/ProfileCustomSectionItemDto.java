package com.glancy.backend.dto;

/**
 * 背景：
 *  - 用户个性化画像需要记录自定义维度下的离散条目，原有接口仅支持兴趣等简单文本。
 * 目的：
 *  - 以不可变 DTO 承载自定义大项中的单条配置，确保序列化语义稳定并支持未来扩展。
 * 关键决策与取舍：
 *  - 采用 record 以表达值对象语义；若后续需要标识符或排序权重，可在此新增字段并保持兼容。
 * 影响范围：
 *  - 被 UserProfileRequest/Response 复用，用于在前后端之间传递自定义小项。
 * 演进与TODO：
 *  - TODO: 如需支持多语言标签或富文本，可增加结构化字段并在转换器中实现版本兼容。
 */
public record ProfileCustomSectionItemDto(
    /** 自定义小项的人类可读标签 */
    String label,
    /** 用户填写的具体内容 */
    String value
) {}
