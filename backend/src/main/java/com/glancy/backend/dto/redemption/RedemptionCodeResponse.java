package com.glancy.backend.dto.redemption;

import com.glancy.backend.entity.redemption.RedemptionEffectType;
import java.time.LocalDateTime;


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
