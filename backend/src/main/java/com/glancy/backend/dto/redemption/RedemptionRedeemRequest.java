package com.glancy.backend.dto.redemption;

import jakarta.validation.constraints.NotBlank;

public record RedemptionRedeemRequest(@NotBlank(message = "兑换码不能为空") String code) {}
