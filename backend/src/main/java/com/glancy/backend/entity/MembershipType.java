package com.glancy.backend.entity;

import java.util.Locale;
import java.util.Optional;

/**
 * 背景：
 *  - 历史实现仅通过布尔字段区分是否会员，无法表达会员等级与权益。
 * 目的：
 *  - 定义受支持的会员等级，并提供等级比较与计划映射能力，支撑更精细的权限控制。
 * 关键决策与取舍：
 *  - 采用枚举而非字符串常量，借助类型系统防止非法值；保留优先级用于快速比较。
 * 影响范围：
 *  - 服务层在判定会员能力时依赖该枚举；配置计划名需与 {@link #fromPlanLabel(String)} 支持的值对齐。
 * 演进与TODO：
 *  - 若后续引入更多等级或区域化权益，可扩展优先级或引入策略模式封装权益矩阵。
 */
public enum MembershipType {
    NONE(0),
    PLUS(1),
    PRO(2),
    PREMIUM(3);

    private final int priority;

    MembershipType(int priority) {
        this.priority = priority;
    }

    /**
     * 判断当前等级是否至少具备目标等级所需的优先级。
     */
    public boolean canAccess(MembershipType required) {
        return required == null || this.priority >= required.priority;
    }

    /**
     * 根据配置中的计划标签解析所需的会员等级。
     *
     * @param plan 配置声明的计划标签，例如 "pro"、"premium"。
     * @return 若计划对所有用户开放返回 {@link Optional#empty()}，否则返回对应的最低会员等级。
     */
    public static Optional<MembershipType> fromPlanLabel(String plan) {
        if (plan == null || plan.isBlank()) {
            return Optional.empty();
        }
        String normalized = plan.trim().toLowerCase(Locale.ROOT);
        return switch (normalized) {
            case "all", "free" -> Optional.empty();
            case "plus" -> Optional.of(PLUS);
            case "pro" -> Optional.of(PRO);
            case "premium" -> Optional.of(PREMIUM);
            default -> Optional.of(PREMIUM);
        };
    }
}
