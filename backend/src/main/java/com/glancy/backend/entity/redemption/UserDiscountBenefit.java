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
