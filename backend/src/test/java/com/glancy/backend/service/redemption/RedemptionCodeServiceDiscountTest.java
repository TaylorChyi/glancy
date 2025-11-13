package com.glancy.backend.service.redemption;

import static org.assertj.core.api.Assertions.assertThat;

import com.glancy.backend.dto.redemption.RedemptionCodeCreateRequest;
import com.glancy.backend.dto.redemption.RedemptionRedeemRequest;
import com.glancy.backend.dto.redemption.RedemptionRedeemResponse;
import com.glancy.backend.entity.User;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import org.junit.jupiter.api.Test;

class RedemptionCodeServiceDiscountTest extends AbstractRedemptionCodeServiceTest {

  @Test
  void GivenDiscountCode_WhenRedeem_ThenPersistBenefit() {
    User user = persistUser("discount-user");
    LocalDateTime now = currentTime();
    LocalDateTime discountFrom = now.minusHours(1);
    LocalDateTime discountUntil = now.plusDays(3);
    RedemptionCodeCreateRequest createRequest =
        discountCode(
            new DiscountCodeParams(
                "SALE20",
                now.minusHours(2),
                now.plusDays(2),
                5,
                2,
                BigDecimal.valueOf(20),
                discountFrom,
                discountUntil));
    redemptionCodeService.createCode(createRequest);

    RedemptionRedeemResponse response =
        redemptionCodeService.redeem(user.getId(), new RedemptionRedeemRequest("SALE20"));

    assertThat(response.discount()).isNotNull();
    assertDiscountBenefit(response, BigDecimal.valueOf(20), discountFrom, discountUntil);
  }
}
