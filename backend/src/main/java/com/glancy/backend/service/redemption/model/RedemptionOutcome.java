package com.glancy.backend.service.redemption.model;

import com.glancy.backend.service.membership.MembershipSnapshot;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Optional;

/**
 * 背景：
 *  - 策略执行后需要返回统一的领域结果，供服务层拼装 DTO。
 * 目的：
 *  - 封装会员或折扣权益，保持处理链条的抽象一致。
 * 关键决策与取舍：
 *  - 采用 Optional 语义而非 null 检查，提升可读性；
 *  - 将折扣信息直接存储为原始字段，避免耦合 DTO 类型。
 * 影响范围：
 *  - RedemptionCodeService 在装配响应时使用。
 * 演进与TODO：
 *  - 如需支持组合效果，可拓展为列表结构。
 */
public record RedemptionOutcome(
    MembershipSnapshot membershipSnapshot,
    BigDecimal discountPercentage,
    LocalDateTime discountValidFrom,
    LocalDateTime discountValidUntil
) {
    public static RedemptionOutcome empty() {
        return new RedemptionOutcome(null, null, null, null);
    }

    public static RedemptionOutcome forMembership(MembershipSnapshot snapshot) {
        return new RedemptionOutcome(snapshot, null, null, null);
    }

    public static RedemptionOutcome forDiscount(
        BigDecimal discountPercentage,
        LocalDateTime discountValidFrom,
        LocalDateTime discountValidUntil
    ) {
        return new RedemptionOutcome(null, discountPercentage, discountValidFrom, discountValidUntil);
    }

    public Optional<MembershipSnapshot> membership() {
        return Optional.ofNullable(membershipSnapshot);
    }

    public Optional<BigDecimal> discountPercentageOptional() {
        return Optional.ofNullable(discountPercentage);
    }
}
