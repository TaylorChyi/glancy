/**
 * 背景：
 *  - 用户画像响应此前与其他领域 DTO 混放，同时使用可变 Bean 难以保证只读语义。
 * 目的：
 *  - 在 user 包提供不可变画像视图对象，统一资料返回模型并凸显领域边界。
 * 关键决策与取舍：
 *  - 采用 record 表达只读视图，必要时可通过版本字段扩展；包划分避免与认证模型耦合。
 * 影响范围：
 *  - UserProfileService 及测试需更新导入路径与访问器方式。
 * 演进与TODO：
 *  - TODO: 若支持多画像版本，应在此引入版本标记或独立视图对象。
 */
package com.glancy.backend.dto.user;

import java.util.List;

public record UserProfileResponse(
    /** 画像主键标识 */
    Long id,
    /** 对应的用户主键 */
    Long userId,
    /** 用户当前职业角色 */
    String job,
    /** 用户兴趣标签原文 */
    String interest,
    /** 用户学习目标描述 */
    String goal,
    /** 用户学历背景描述 */
    String education,
    /** 用户当前能力的自我评估 */
    String currentAbility,
    /** 用户自定义的每日词汇目标，单位：个 */
    Integer dailyWordTarget,
    /** 用户未来学习或规划描述 */
    String futurePlan,
    /** 用户偏好的释义回应语气 */
    String responseStyle,
    /** 自定义维度的层级配置 */
    List<ProfileCustomSectionDto> customSections
) {
    @SuppressWarnings("PMD.UnusedAssignment")
    public UserProfileResponse {
        // 防御性拷贝自定义区块，保持 record 不可变语义且兼容 PMD 规则。
        customSections = sanitizeSections(customSections);
    }

    private static List<ProfileCustomSectionDto> sanitizeSections(List<ProfileCustomSectionDto> sections) {
        return sections == null ? List.of() : List.copyOf(sections);
    }
}
