package com.glancy.backend.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import java.util.List;


@JsonIgnoreProperties(ignoreUnknown = true)
public record UserProfileRequest(
    /** 用户当前的职业角色描述 */
    String job,
    /** 用户填写的兴趣标签，使用分隔符拆分 */
    String interest,
    /** 学习或使用目标说明 */
    String goal,
    /** 用户当前的学历背景 */
    String education,
    /** 对自身能力水平的描述 */
    String currentAbility,
    /** 每日词汇目标，单位：个 */
    Integer dailyWordTarget,
    /** 对未来规划或学习节奏的补充描述 */
    String futurePlan,
    /** 首选的释义回应语气 */
    String responseStyle,
    /** 用户自定义维度的配置集合 */
    List<ProfileCustomSectionDto> customSections
) {}
