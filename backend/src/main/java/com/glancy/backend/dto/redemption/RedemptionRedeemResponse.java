package com.glancy.backend.dto.redemption;

import com.glancy.backend.entity.redemption.RedemptionEffectType;

/**
 * 背景：
 *  - 兑换结果需要返回生效的权益信息。
 * 目的：
 *  - 封装兑换完成后的权益详情。
 * 关键决策与取舍：
 *  - 与 RedemptionCodeResponse 共享结构，便于前端重用组件。
 * 影响范围：
 *  - 兑换接口响应。
 * 演进与TODO：
 *  - 可加入兑换流水号等信息便于追踪。
 */
public record RedemptionRedeemResponse(
    String code,
    RedemptionEffectType effectType,
    MembershipRewardResponse membership,
    DiscountRewardResponse discount
) {}
