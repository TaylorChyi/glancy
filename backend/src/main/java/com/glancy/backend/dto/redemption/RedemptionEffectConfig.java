package com.glancy.backend.dto.redemption;

import com.glancy.backend.entity.redemption.RedemptionEffectType;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;

public record RedemptionEffectConfig(
        @NotNull(message = "兑换效果类型不能为空") RedemptionEffectType type,
        @Valid MembershipEffectConfig membership,
        @Valid DiscountEffectConfig discount) {}
