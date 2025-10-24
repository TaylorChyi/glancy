/**
 * 背景：
 *  - 自定义资料条目 DTO 先前与其他领域混放，不利于识别其用户画像职责。
 * 目的：
 *  - 在 user 包承载单个自定义条目值对象，保持序列化稳定并支撑扩展。
 * 关键决策与取舍：
 *  - 采用 record 表达值对象语义，未来若需排序或多语言可扩展字段。
 * 影响范围：
 *  - UserProfileRequest/Response 及编解码器导入路径更新。
 * 演进与TODO：
 *  - TODO: 支持富文本或多语言时在此新增结构化字段并保持兼容。
 */
package com.glancy.backend.dto.user;

public record ProfileCustomSectionItemDto(
    /** 自定义小项的人类可读标签 */
    String label,
    /** 用户填写的具体内容 */
    String value
) {}
