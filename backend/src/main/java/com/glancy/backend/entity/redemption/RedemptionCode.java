package com.glancy.backend.entity.redemption;

import com.glancy.backend.entity.BaseEntity;
import com.glancy.backend.entity.MembershipType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;
import jakarta.persistence.Version;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Duration;
import java.time.LocalDateTime;

/**
 * 背景：
 *  - 业务需要支持多种兑换码，并携带生效时间、兑换次数等复合约束。
 * 目的：
 *  - 使用实体对象建模兑换码生命周期及其配置，便于服务层统一校验与演进。
 * 关键决策与取舍：
 *  - 采用乐观锁字段 version，保证并发兑换时不会出现兑换次数超限的脏写；
 *  - 以小时存储会员时长，兼顾精度和数据库兼容性。若未来需要分钟级控制，可扩展为分钟级常量。
 * 影响范围：
 *  - 服务层校验逻辑、处理策略、DTO 映射依赖该模型。
 * 演进与TODO：
 *  - 如需组合效果，可引入子表进行一对多映射；
 *  - 可根据后续 BI 需求扩展兑换来源渠道、创建人等审计字段。
 */
@Entity
@Table(name = "redemption_code")
public class RedemptionCode extends BaseEntity {

    @Column(nullable = false, unique = true, length = 64)
    private String code;

    @Column(nullable = false)
    private LocalDateTime redeemableFrom;

    @Column(nullable = false)
    private LocalDateTime redeemableUntil;

    @Column(nullable = false)
    private Integer totalQuota;

    @Column(nullable = false)
    private Integer perUserQuota;

    @Column(nullable = false)
    private Integer totalRedeemed = 0;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private RedemptionEffectType effectType;

    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    private MembershipType membershipType;

    @Column
    private Integer membershipExtensionHours;

    @Column(precision = 5, scale = 2)
    private BigDecimal discountPercentage;

    @Column
    private LocalDateTime discountValidFrom;

    @Column
    private LocalDateTime discountValidUntil;

    @Version
    private Long version;

    public String getCode() {
        return code;
    }

    public void setCode(String code) {
        this.code = code;
    }

    public LocalDateTime getRedeemableFrom() {
        return redeemableFrom;
    }

    public void setRedeemableFrom(LocalDateTime redeemableFrom) {
        this.redeemableFrom = redeemableFrom;
    }

    public LocalDateTime getRedeemableUntil() {
        return redeemableUntil;
    }

    public void setRedeemableUntil(LocalDateTime redeemableUntil) {
        this.redeemableUntil = redeemableUntil;
    }

    public Integer getTotalQuota() {
        return totalQuota;
    }

    public void setTotalQuota(Integer totalQuota) {
        this.totalQuota = totalQuota;
    }

    public Integer getPerUserQuota() {
        return perUserQuota;
    }

    public void setPerUserQuota(Integer perUserQuota) {
        this.perUserQuota = perUserQuota;
    }

    public Integer getTotalRedeemed() {
        return safeTotalRedeemed();
    }

    public void setTotalRedeemed(Integer totalRedeemed) {
        this.totalRedeemed = totalRedeemed;
    }

    public RedemptionEffectType getEffectType() {
        return effectType;
    }

    public void setEffectType(RedemptionEffectType effectType) {
        this.effectType = effectType;
    }

    public MembershipType getMembershipType() {
        return membershipType;
    }

    public void setMembershipType(MembershipType membershipType) {
        this.membershipType = membershipType;
    }

    public Integer getMembershipExtensionHours() {
        return membershipExtensionHours;
    }

    public void setMembershipExtensionHours(Integer membershipExtensionHours) {
        this.membershipExtensionHours = membershipExtensionHours;
    }

    public BigDecimal getDiscountPercentage() {
        return discountPercentage;
    }

    public void setDiscountPercentage(BigDecimal discountPercentage) {
        this.discountPercentage = discountPercentage;
    }

    public LocalDateTime getDiscountValidFrom() {
        return discountValidFrom;
    }

    public void setDiscountValidFrom(LocalDateTime discountValidFrom) {
        this.discountValidFrom = discountValidFrom;
    }

    public LocalDateTime getDiscountValidUntil() {
        return discountValidUntil;
    }

    public void setDiscountValidUntil(LocalDateTime discountValidUntil) {
        this.discountValidUntil = discountValidUntil;
    }

    public Long getVersion() {
        return version;
    }

    public void setVersion(Long version) {
        this.version = version;
    }

    /**
     * 意图：判断当前时间是否位于兑换有效期内。
     */
    public boolean isRedeemableAt(LocalDateTime timestamp) {
        return !timestamp.isBefore(redeemableFrom) && !timestamp.isAfter(redeemableUntil);
    }

    /**
     * 意图：判断兑换是否还有剩余额度。
     */
    public boolean hasRemainingQuota() {
        return safeTotalRedeemed() < safeTotalQuota();
    }

    /**
     * 意图：累加总兑换次数。
     */
    public void increaseRedemptionCount() {
        this.totalRedeemed = Math.addExact(safeTotalRedeemed(), 1);
    }

    /**
     * 意图：兼容历史数据中的空值，确保兑换次数相关运算稳健。
     */
    private int safeTotalRedeemed() {
        return totalRedeemed == null ? 0 : totalRedeemed;
    }

    private int safeTotalQuota() {
        return totalQuota == null ? 0 : totalQuota;
    }

    /**
     * 意图：转换会员延期配置为 Duration。
     */
    public Duration membershipExtensionDuration() {
        if (membershipExtensionHours == null) {
            return Duration.ZERO;
        }
        return Duration.ofHours(membershipExtensionHours);
    }

    /**
     * 意图：获取标准化折扣百分比（0-1 之间）。
     */
    public BigDecimal normalizedDiscountRate() {
        if (discountPercentage == null) {
            return null;
        }
        return discountPercentage.divide(BigDecimal.valueOf(100), 4, RoundingMode.HALF_UP);
    }
}
