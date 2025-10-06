package com.glancy.backend.dto.redemption;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 背景：
 *  - 折扣类兑换需约束折扣范围与生效时间。
 * 目的：
 *  - 定义折扣百分比和有效期。
 * 关键决策与取舍：
 *  - 折扣百分比采用 0-100 区间，便于直观配置；
 *  - 生效时间使用 LocalDateTime，以兼容跨日场景。
 * 影响范围：
 *  - 折扣策略处理与响应。
 * 演进与TODO：
 *  - 若未来支持按货币单位抵扣，可新增字段表示额度类型。
 */
public record DiscountEffectConfig(
    @NotNull(message = "折扣百分比不能为空")
    @DecimalMin(value = "0.01", message = "折扣百分比需大于 0")
    @DecimalMax(value = "100", message = "折扣百分比不可超过 100")
    BigDecimal percentage,
    @NotNull(message = "折扣开始时间不能为空") LocalDateTime validFrom,
    @NotNull(message = "折扣结束时间不能为空") LocalDateTime validUntil
) {}
