package com.glancy.backend.dto;

/**
 * 背景：
 *  - 用户画像希望按大项聚合配置项，原有数据结构无法表达层级关系。
 * 目的：
 *  - 定义携带大项标题与多条小项内容的不可变 DTO，供序列化与前端渲染复用。
 * 关键决策与取舍：
 *  - 选用 record 并在构造时拷贝列表，避免外部修改破坏只读语义；如需排序可额外增加字段。
 * 影响范围：
 *  - UserProfileRequest/Response、序列化编解码器需要适配新的列表结构。
 * 演进与TODO：
 *  - TODO: 若未来需要国际化标题或可配置图标，可在此新增可选字段并保持向后兼容。
 */
import java.util.List;

public record ProfileCustomSectionDto(
    /** 自定义大项标题 */
    String title,
    /** 大项内的细分条目集合 */
    List<ProfileCustomSectionItemDto> items
) {
    public ProfileCustomSectionDto {
        items = items == null ? List.of() : List.copyOf(items);
    }
}
