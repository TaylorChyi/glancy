package com.glancy.backend.dto.redemption;

import com.glancy.backend.entity.MembershipType;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record MembershipEffectConfig(
    @NotNull(message = "会员等级不能为空") MembershipType membershipType,
    @Min(value = 1, message = "会员延长时长需大于 0 小时") long extensionHours
) {}
