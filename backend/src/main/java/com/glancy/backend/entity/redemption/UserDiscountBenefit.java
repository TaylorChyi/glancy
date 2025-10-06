package com.glancy.backend.entity.redemption;

import com.glancy.backend.entity.BaseEntity;
import com.glancy.backend.entity.User;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 背景：
 *  - 购买折扣类兑换需要记录生效区间与折扣比例，以便其他业务读取。
 * 目的：
 *  - 以实体形式保留用户折扣权益，支撑下游订单或计费模块查询。
 * 关键决策与取舍：
 *  - 折扣与兑换码保持外键关联，方便追踪来源；
 *  - 不立即支持多次叠加/使用次数，由业务在读取时决定是否消耗。
 * 影响范围：
 *  - 折扣策略处理器与潜在的订单模块读取。
 * 演进与TODO：
 *  - 若需支持抵扣券等复杂形态，可引入状态字段或事件溯源。
 */
@Entity
@Table(name = "user_discount_benefit")
public class UserDiscountBenefit extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "code_id", nullable = false)
    private RedemptionCode redemptionCode;

    @Column(nullable = false, precision = 5, scale = 2)
    private BigDecimal discountPercentage;

    @Column(nullable = false)
    private LocalDateTime validFrom;

    @Column(nullable = false)
    private LocalDateTime validUntil;

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public RedemptionCode getRedemptionCode() {
        return redemptionCode;
    }

    public void setRedemptionCode(RedemptionCode redemptionCode) {
        this.redemptionCode = redemptionCode;
    }

    public BigDecimal getDiscountPercentage() {
        return discountPercentage;
    }

    public void setDiscountPercentage(BigDecimal discountPercentage) {
        this.discountPercentage = discountPercentage;
    }

    public LocalDateTime getValidFrom() {
        return validFrom;
    }

    public void setValidFrom(LocalDateTime validFrom) {
        this.validFrom = validFrom;
    }

    public LocalDateTime getValidUntil() {
        return validUntil;
    }

    public void setValidUntil(LocalDateTime validUntil) {
        this.validUntil = validUntil;
    }
}
