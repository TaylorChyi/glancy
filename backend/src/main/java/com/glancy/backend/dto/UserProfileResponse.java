package com.glancy.backend.dto;

/**
 * 背景：
 *  - 画像响应曾使用可变 Bean，字段删除后仍存在 getter/setter，难以保证只读视图的语义。
 * 目的：
 *  - 提供不可变的用户画像视图对象，向前端返回精简后的核心字段。
 * 关键决策与取舍：
 *  - 采用 record，以结构性只读对象显式表达字段集合；若后续字段激增，可考虑 builder + 版本化 DTO。
 * 影响范围：
 *  - 服务与测试改为通过访问器方法（例如 {@code response.job()}）读取字段。
 * 演进与TODO：
 *  - TODO: 若支持多画像版本，应在此引入版本标记或单独的 view model。
 */
import java.util.List;

public record UserProfileResponse(
    /** 画像主键标识 */
    Long id,
    /** 对应的用户主键 */
    Long userId,
    /** 用户最高学历或教育背景描述 */
    String education,
    /** 用户当前职业角色 */
    String job,
    /** 用户兴趣标签原文 */
    String interest,
    /** 用户学习目标描述 */
    String goal,
    /** 当前能力或熟练度自评 */
    String currentAbility,
    /** 用户自定义的每日词汇目标，单位：个 */
    Integer dailyWordTarget,
    /** 用户未来学习或规划描述 */
    String futurePlan,
    /** 自定义区块内容，按配置顺序返回 */
    List<ProfileSectionDto> customSections
) {}
