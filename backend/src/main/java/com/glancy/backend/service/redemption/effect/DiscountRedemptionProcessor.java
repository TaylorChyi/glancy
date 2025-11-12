package com.glancy.backend.service.redemption.effect;

import com.glancy.backend.entity.User;
import com.glancy.backend.entity.redemption.RedemptionCode;
import com.glancy.backend.entity.redemption.RedemptionEffectType;
import com.glancy.backend.entity.redemption.UserDiscountBenefit;
import com.glancy.backend.exception.InvalidRequestException;
import com.glancy.backend.repository.UserDiscountBenefitRepository;
import com.glancy.backend.service.redemption.model.RedemptionOutcome;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import org.springframework.stereotype.Component;

@Component
public class DiscountRedemptionProcessor implements RedemptionEffectProcessor {

  private final UserDiscountBenefitRepository benefitRepository;

  public DiscountRedemptionProcessor(UserDiscountBenefitRepository benefitRepository) {
    this.benefitRepository = benefitRepository;
  }

  @Override
  public RedemptionEffectType supportedType() {
    return RedemptionEffectType.DISCOUNT;
  }

  @Override
  public RedemptionOutcome process(RedemptionCode code, User user, LocalDateTime redemptionTime) {
    BigDecimal percentage = code.getDiscountPercentage();
    LocalDateTime validFrom = code.getDiscountValidFrom();
    LocalDateTime validUntil = code.getDiscountValidUntil();
    if (percentage == null || validFrom == null || validUntil == null) {
      throw new InvalidRequestException("折扣兑换配置不完整");
    }
    UserDiscountBenefit benefit = new UserDiscountBenefit();
    benefit.setUser(user);
    benefit.setRedemptionCode(code);
    benefit.setDiscountPercentage(percentage);
    benefit.setValidFrom(validFrom);
    benefit.setValidUntil(validUntil);
    benefitRepository.save(benefit);
    return RedemptionOutcome.forDiscount(percentage, validFrom, validUntil);
  }
}
