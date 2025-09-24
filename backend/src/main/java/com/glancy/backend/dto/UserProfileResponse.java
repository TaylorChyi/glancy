package com.glancy.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

/**
 * DTO representing a user's profile.
 */
@Data
@AllArgsConstructor
public class UserProfileResponse {

    /** 用户画像主键标识 */
    private Long id;

    /** 关联的用户主键 */
    private Long userId;

    /** 用户年龄，单位：岁 */
    private Integer age;

    /** 用户性别自陈描述 */
    private String gender;

    /** 用户当前职业角色 */
    private String job;

    /** 用户兴趣标签原文 */
    private String interest;

    /** 用户学习目标描述 */
    private String goal;

    /** 用户自定义的每日词汇目标，单位：个 */
    private Integer dailyWordTarget;

    /** 用户未来学习或规划描述 */
    private String futurePlan;
}
