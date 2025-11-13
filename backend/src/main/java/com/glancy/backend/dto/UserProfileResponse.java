package com.glancy.backend.dto;

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
        List<ProfileCustomSectionDto> customSections) {
    public UserProfileResponse {
        customSections = customSections == null ? List.of() : List.copyOf(customSections);
    }
}
