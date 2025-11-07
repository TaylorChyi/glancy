package com.glancy.backend.dto.redemption;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.LocalDateTime;

public record DiscountEffectConfig(
    @NotNull(message = "折扣百分比不能为空")
    @DecimalMin(value = "0.01", message = "折扣百分比需大于 0")
    @DecimalMax(value = "100", message = "折扣百分比不可超过 100")
    BigDecimal percentage,
    @NotNull(message = "折扣开始时间不能为空") LocalDateTime validFrom,
    @NotNull(message = "折扣结束时间不能为空") LocalDateTime validUntil
) {}
