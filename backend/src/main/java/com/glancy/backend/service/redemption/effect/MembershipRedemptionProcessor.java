package com.glancy.backend.service.redemption.effect;

import com.glancy.backend.entity.User;
import com.glancy.backend.entity.redemption.RedemptionCode;
import com.glancy.backend.entity.redemption.RedemptionEffectType;
import com.glancy.backend.exception.InvalidRequestException;
import com.glancy.backend.service.membership.MembershipLifecycleService;
import com.glancy.backend.service.membership.MembershipSnapshot;
import com.glancy.backend.service.redemption.model.RedemptionOutcome;
import java.time.Duration;
import java.time.LocalDateTime;
import org.springframework.stereotype.Component;

@Component
public class MembershipRedemptionProcessor implements RedemptionEffectProcessor {

  private final MembershipLifecycleService membershipLifecycleService;

  public MembershipRedemptionProcessor(MembershipLifecycleService membershipLifecycleService) {
    this.membershipLifecycleService = membershipLifecycleService;
  }

  @Override
  public RedemptionEffectType supportedType() {
    return RedemptionEffectType.MEMBERSHIP;
  }

  @Override
  public RedemptionOutcome process(RedemptionCode code, User user, LocalDateTime redemptionTime) {
    Duration extension = code.membershipExtensionDuration();
    if (extension.isZero()) {
      throw new InvalidRequestException("会员兑换未配置延长时长");
    }
    MembershipSnapshot snapshot =
        membershipLifecycleService.extendMembership(
            user.getId(), code.getMembershipType(), extension, redemptionTime);
    return RedemptionOutcome.forMembership(snapshot);
  }
}
