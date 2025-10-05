package com.glancy.backend.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import java.util.List;

/**
 * 背景：
 *  - 个性化资料需要承载多个自定义区块，但历史实现缺乏统一结构导致解析分散。
 * 目的：
 *  - 以不可变 record 描述区块元数据与子项集合，便于前端动态渲染与后端校验。
 * 关键决策与取舍：
 *  - 使用 {@link JsonIgnoreProperties} 容忍未知字段，保障老版本客户端在扩展字段时仍可写入；
 *  - 子项集合以 `List` 表示，保持顺序语义，支持 UI 按预设顺序展示。
 * 影响范围：
 *  - `UserProfileRequest`/`UserProfileResponse` 按此结构编解码 JSON。
 * 演进与TODO：
 *  - TODO: 若后续引入区块级别的可见性控制，可在此增加特性标识。
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public record ProfileSectionDto(
    /** 区块业务标识，与前端 Schema 对应 */
    String id,
    /** 区块展示标题，允许自定义 */
    String title,
    /** 区块内的子项集合 */
    List<ProfileSectionItemDto> items
) {}
