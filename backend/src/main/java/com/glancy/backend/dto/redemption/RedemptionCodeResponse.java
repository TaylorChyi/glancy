package com.glancy.backend.dto.redemption;

import com.glancy.backend.entity.redemption.RedemptionEffectType;
import java.time.LocalDateTime;

/**
 * 背景：
 *  - 接口需要返回兑换码的配置详情。
 * 目的：
 *  - 封装兑换码元数据，便于前端渲染管理界面。
 * 关键决策与取舍：
 *  - 直接暴露 effectType，调用方可据此区分展示。
 * 影响范围：
 *  - 创建与查询接口响应。
 * 演进与TODO：
 *  - 可增加创建人、渠道等字段。
 */
public record RedemptionCodeResponse(
    String code,
    LocalDateTime redeemableFrom,
    LocalDateTime redeemableUntil,
    int totalQuota,
    int perUserQuota,
    int totalRedeemed,
    RedemptionEffectType effectType,
    MembershipEffectConfig membership,
    DiscountEffectConfig discount
) {}
