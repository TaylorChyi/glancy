package com.glancy.backend.dto.redemption;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 背景：
 *  - 客户端需要获知折扣比例与生效期。
 * 目的：
 *  - 返回折扣权益的核心信息。
 * 关键决策与取舍：
 *  - 百分比仍沿用 0-100 表示方式，保持与配置端一致。
 * 影响范围：
 *  - 兑换结果展示。
 * 演进与TODO：
 *  - 若增加叠加规则，可补充状态字段。
 */
public record DiscountRewardResponse(BigDecimal percentage, LocalDateTime validFrom, LocalDateTime validUntil) {}
