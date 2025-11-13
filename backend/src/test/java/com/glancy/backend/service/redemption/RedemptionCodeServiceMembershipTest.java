package com.glancy.backend.service.redemption;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;

import com.glancy.backend.dto.redemption.RedemptionCodeCreateRequest;
import com.glancy.backend.dto.redemption.RedemptionRedeemRequest;
import com.glancy.backend.dto.redemption.RedemptionRedeemResponse;
import com.glancy.backend.entity.MembershipType;
import com.glancy.backend.entity.User;
import com.glancy.backend.entity.redemption.RedemptionCode;
import com.glancy.backend.entity.redemption.RedemptionEffectType;
import com.glancy.backend.entity.redemption.RedemptionRecord;
import com.glancy.backend.exception.InvalidRequestException;
import java.time.LocalDateTime;
import java.util.List;
import org.junit.jupiter.api.Test;

class RedemptionCodeServiceMembershipTest extends AbstractRedemptionCodeServiceTest {

    @Test
    void GivenMembershipCode_WhenRedeem_ThenExtendMembership() {
        User user = persistUser("member-user");
        LocalDateTime now = currentTime();
        RedemptionCodeCreateRequest createRequest = membershipCode(new MembershipCodeParams(
                "VIP2024", now.minusHours(1), now.plusDays(1), 10, 2, MembershipType.PLUS, 24L));
        redemptionCodeService.createCode(createRequest);

        RedemptionRedeemResponse response =
                redemptionCodeService.redeem(user.getId(), new RedemptionRedeemRequest("VIP2024"));

        User refreshed = userRepository.findById(user.getId()).orElseThrow();
        assertThat(response.membership()).isNotNull();
        assertThat(response.membership().membershipType()).isEqualTo(MembershipType.PLUS);
        assertThat(refreshed.getMembershipType()).isEqualTo(MembershipType.PLUS);
        assertThat(refreshed.getMembershipExpiresAt()).isNotNull();
        assertThat(refreshed.getMembershipExpiresAt()).isAfter(now);
    }

    @Test
    void GivenQuotaExhausted_WhenRedeem_ThenThrow() {
        User user = persistUser("quota-user");
        LocalDateTime now = currentTime();
        RedemptionCodeCreateRequest createRequest = membershipCode(
                new MembershipCodeParams("LIMIT1", now.minusHours(1), now.plusDays(1), 1, 1, MembershipType.PLUS, 12L));
        redemptionCodeService.createCode(createRequest);
        redemptionCodeService.redeem(user.getId(), new RedemptionRedeemRequest("LIMIT1"));

        InvalidRequestException ex = assertThrows(
                InvalidRequestException.class,
                () -> redemptionCodeService.redeem(user.getId(), new RedemptionRedeemRequest("LIMIT1")));
        assertThat(ex.getMessage()).contains("次数");
    }

    @Test
    void GivenLegacyCodeWithLowercase_WhenRedeem_ThenNormalizeAndPersistRecord() {
        User user = persistUser("legacy-user");
        LocalDateTime now = currentTime();
        RedemptionCode legacy = new RedemptionCode();
        legacy.setCode("legacy1");
        legacy.setRedeemableFrom(now.minusHours(2));
        legacy.setRedeemableUntil(now.plusDays(1));
        legacy.setTotalQuota(5);
        legacy.setPerUserQuota(2);
        legacy.setEffectType(RedemptionEffectType.MEMBERSHIP);
        legacy.setMembershipType(MembershipType.PLUS);
        legacy.setMembershipExtensionHours(12);
        redemptionCodeRepository.saveAndFlush(legacy);

        RedemptionRedeemResponse response =
                redemptionCodeService.redeem(user.getId(), new RedemptionRedeemRequest("LEGACY1"));

        List<RedemptionRecord> records = redemptionRecordRepository.findAll();
        RedemptionCode refreshed =
                redemptionCodeRepository.findById(legacy.getId()).orElseThrow();
        assertThat(response.membership()).isNotNull();
        assertThat(records).hasSize(1);
        assertThat(refreshed.getTotalRedeemed()).isEqualTo(1);
    }
}
