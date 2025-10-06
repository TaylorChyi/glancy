package com.glancy.backend.entity;

import lombok.Getter;

/**
 * 背景：
 *  - 过去仅以布尔字段 `member` 表示会员身份，无法区分具体套餐与有效期。
 * 目的：
 *  - 以穷举的方式定义当前上线的会员等级，供实体与 DTO 统一引用。
 * 关键决策与取舍：
 *  - 采用枚举而非字符串常量，避免魔法值并保障编译期校验；
 *  - 暂不引入更复杂的层级结构，后续若有多地域差异可通过扩展字段适配。
 * 影响范围：
 *  - 被 User 实体及相关服务引用，驱动前端渲染与计费逻辑。
 * 演进与TODO：
 *  - 如需支持按地区/渠道定制套餐，可在枚举上新增元数据或迁移至数据库表管理。
 */
@Getter
public enum MembershipTier {
    PLUS,
    PRO,
    PREMIUM,
}
