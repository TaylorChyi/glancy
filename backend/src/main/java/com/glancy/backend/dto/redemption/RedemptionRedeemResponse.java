package com.glancy.backend.dto.redemption;

import com.glancy.backend.entity.redemption.RedemptionEffectType;

public record RedemptionRedeemResponse(
    String code,
    RedemptionEffectType effectType,
    MembershipRewardResponse membership,
    DiscountRewardResponse discount
) {}
