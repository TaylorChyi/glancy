package com.glancy.backend.entity.redemption;

/**
 * 背景：
 *  - 兑换码功能需要抽象不同的收益类型以支撑多业务场景。
 * 目的：
 *  - 枚举兑换效果的分类，使策略模式能够据此分发处理逻辑。
 * 关键决策与取舍：
 *  - 采用枚举而非字符串常量，避免魔法值并提升类型安全；后续若需要扩展新的效果，
 *    直接新增枚举常量并实现对应策略即可。
 * 影响范围：
 *  - 被兑换码实体、处理策略及响应 DTO 引用。
 * 演进与TODO：
 *  - 如需参数化更多维度（如组合效果），可引入复合枚举或策略装饰器。
 */
public enum RedemptionEffectType {
    MEMBERSHIP,
    DISCOUNT,
}
