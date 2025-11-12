package com.glancy.backend.service.redemption.effect;

import com.glancy.backend.entity.User;
import com.glancy.backend.entity.redemption.RedemptionCode;
import com.glancy.backend.entity.redemption.RedemptionEffectType;
import com.glancy.backend.service.redemption.model.RedemptionOutcome;
import java.time.LocalDateTime;

public interface RedemptionEffectProcessor {
  RedemptionEffectType supportedType();

  RedemptionOutcome process(RedemptionCode code, User user, LocalDateTime redemptionTime);
}
