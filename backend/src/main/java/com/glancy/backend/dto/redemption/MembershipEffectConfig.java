package com.glancy.backend.dto.redemption;

import com.glancy.backend.entity.MembershipType;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

/**
 * 背景：
 *  - 会员类兑换需要指定会员等级与延长时长。
 * 目的：
 *  - 约束会员兑换配置，确保时长为正值。
 * 关键决策与取舍：
 *  - 以小时为粒度便于后续支持非整天配置。
 * 影响范围：
 *  - 策略处理器与实体映射。
 * 演进与TODO：
 *  - 后续可支持不同时间单位，通过增加枚举来选择。
 */
public record MembershipEffectConfig(
    @NotNull(message = "会员等级不能为空") MembershipType membershipType,
    @Min(value = 1, message = "会员延长时长需大于 0 小时") long extensionHours
) {}
