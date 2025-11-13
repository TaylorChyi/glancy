package com.glancy.backend.service.redemption.model;

import com.glancy.backend.service.membership.MembershipSnapshot;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Optional;

public record RedemptionOutcome(
        MembershipSnapshot membershipSnapshot,
        BigDecimal discountPercentage,
        LocalDateTime discountValidFrom,
        LocalDateTime discountValidUntil) {
    public static RedemptionOutcome empty() {
        return new RedemptionOutcome(null, null, null, null);
    }

    public static RedemptionOutcome forMembership(MembershipSnapshot snapshot) {
        return new RedemptionOutcome(snapshot, null, null, null);
    }

    public static RedemptionOutcome forDiscount(
            BigDecimal discountPercentage, LocalDateTime discountValidFrom, LocalDateTime discountValidUntil) {
        return new RedemptionOutcome(null, discountPercentage, discountValidFrom, discountValidUntil);
    }

    public Optional<MembershipSnapshot> membership() {
        return Optional.ofNullable(membershipSnapshot);
    }

    public Optional<BigDecimal> discountPercentageOptional() {
        return Optional.ofNullable(discountPercentage);
    }
}
