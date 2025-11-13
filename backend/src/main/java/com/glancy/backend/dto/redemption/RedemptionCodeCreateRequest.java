package com.glancy.backend.dto.redemption;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDateTime;

public record RedemptionCodeCreateRequest(
        @NotBlank(message = "兑换码编码不能为空") String code,
        @NotNull(message = "兑换开始时间不能为空") LocalDateTime redeemableFrom,
        @NotNull(message = "兑换结束时间不能为空") LocalDateTime redeemableUntil,
        @Min(value = 1, message = "总兑换次数需大于 0") int totalQuota,
        @Min(value = 1, message = "单用户兑换次数需大于 0") int perUserQuota,
        @NotNull(message = "兑换效果不能为空") @Valid RedemptionEffectConfig effect) {}
