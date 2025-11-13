package com.glancy.backend.dto.redemption;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record DiscountRewardResponse(BigDecimal percentage, LocalDateTime validFrom, LocalDateTime validUntil) {}
