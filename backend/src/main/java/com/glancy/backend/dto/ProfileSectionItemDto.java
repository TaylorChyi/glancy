package com.glancy.backend.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

/**
 * 背景：
 *  - 个性化画像的自定义区块此前以自由 JSON 存储，缺乏结构化契约，导致前后端难以演进。
 * 目的：
 *  - 以不可变 record 承载区块内的子项，为后续字段扩展提供稳定的序列化结构。
 * 关键决策与取舍：
 *  - 采用 record 提供只读语义，并保留 {@link JsonIgnoreProperties} 以容忍遗留客户端冗余字段；
 *  - 字段命名以业务语义为先，避免硬编码 UI 细节。
 * 影响范围：
 *  - `UserProfileRequest`/`UserProfileResponse` 在序列化时复用该结构。
 * 演进与TODO：
 *  - TODO: 如需支持多类型输入控件，可在此补充类型与校验元数据。
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public record ProfileSectionItemDto(
    /** 子项业务标识，用于与前端 Schema 对齐 */
    String id,
    /** 子项展示标题，允许用户自定义 */
    String label,
    /** 用户填写的值，允许为空 */
    String value
) {}
