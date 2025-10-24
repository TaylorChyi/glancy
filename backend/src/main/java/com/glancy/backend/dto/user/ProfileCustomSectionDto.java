/**
 * 背景：
 *  - 自定义资料区块 DTO 过去放在扁平目录，难以与非资料类模型区分；同时原始数据结构无法表达层级。
 * 目的：
 *  - 在 user 包提供不可变的资料自定义区块载体，用于序列化与前端渲染。
 * 关键决策与取舍：
 *  - 选用 record 并在构造时拷贝列表，保证只读语义；通过包划分强化资料场景归属。
 * 影响范围：
 *  - UserProfileRequest/Response、序列化编解码器导入路径需调整。
 * 演进与TODO：
 *  - TODO: 未来如需国际化标题或图标，可在本包追加可选字段保持兼容。
 */
package com.glancy.backend.dto.user;

import java.util.List;

public record ProfileCustomSectionDto(
    /** 自定义大项标题 */
    String title,
    /** 大项内的细分条目集合 */
    List<ProfileCustomSectionItemDto> items
) {
    public ProfileCustomSectionDto {
        items = sanitizeItems(items); // NOPMD - UnusedAssignment: record 构造阶段需重绑定以完成防御性拷贝
    }

    private static List<ProfileCustomSectionItemDto> sanitizeItems(List<ProfileCustomSectionItemDto> source) {
        return source == null ? List.of() : List.copyOf(source);
    }
}
