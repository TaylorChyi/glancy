package com.glancy.backend.service.redemption;

import com.glancy.backend.dto.redemption.DiscountEffectConfig;
import com.glancy.backend.dto.redemption.MembershipEffectConfig;
import com.glancy.backend.dto.redemption.RedemptionCodeCreateRequest;
import com.glancy.backend.dto.redemption.RedemptionEffectConfig;
import com.glancy.backend.dto.redemption.RedemptionRedeemResponse;
import com.glancy.backend.entity.MembershipType;
import com.glancy.backend.entity.User;
import com.glancy.backend.entity.redemption.RedemptionEffectType;
import com.glancy.backend.entity.redemption.UserDiscountBenefit;
import com.glancy.backend.repository.RedemptionCodeRepository;
import com.glancy.backend.repository.RedemptionRecordRepository;
import com.glancy.backend.repository.UserDiscountBenefitRepository;
import com.glancy.backend.repository.UserRepository;
import java.math.BigDecimal;
import java.time.Clock;
import java.time.LocalDateTime;
import java.util.List;
import org.assertj.core.api.Assertions;
import org.junit.jupiter.api.BeforeEach;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest(
        properties = {
            "oss.endpoint=http://localhost",
            "oss.bucket=test-bucket",
            "oss.access-key-id=test-id",
            "oss.access-key-secret=test-secret",
            "oss.verify-location=false",
        })
@Transactional
abstract class AbstractRedemptionCodeServiceTest {

    @Autowired
    protected RedemptionCodeService redemptionCodeService;

    @Autowired
    protected RedemptionCodeRepository redemptionCodeRepository;

    @Autowired
    protected RedemptionRecordRepository redemptionRecordRepository;

    @Autowired
    protected UserRepository userRepository;

    @Autowired
    protected UserDiscountBenefitRepository userDiscountBenefitRepository;

    @Autowired
    protected Clock clock;

    @BeforeEach
    void cleanRepositories() {
        redemptionRecordRepository.deleteAll();
        redemptionCodeRepository.deleteAll();
        userDiscountBenefitRepository.deleteAll();
        userRepository.deleteAll();
    }

    protected User persistUser(String username) {
        User user = new User();
        user.setUsername(username);
        user.setPassword("password");
        user.setEmail(username + "@example.com");
        user.setPhone("1" + Math.abs(username.hashCode()));
        return userRepository.save(user);
    }

    protected RedemptionCodeCreateRequest membershipCode(MembershipCodeParams params) {
        RedemptionEffectConfig effect = new RedemptionEffectConfig(
                RedemptionEffectType.MEMBERSHIP,
                new MembershipEffectConfig(params.membershipType(), params.extensionHours()),
                null);
        return new RedemptionCodeCreateRequest(
                params.code(),
                params.redeemableFrom(),
                params.redeemableUntil(),
                params.totalQuota(),
                params.perUserQuota(),
                effect);
    }

    protected RedemptionCodeCreateRequest discountCode(DiscountCodeParams params) {
        RedemptionEffectConfig effect = new RedemptionEffectConfig(
                RedemptionEffectType.DISCOUNT,
                null,
                new DiscountEffectConfig(params.percentage(), params.validFrom(), params.validUntil()));
        return new RedemptionCodeCreateRequest(
                params.code(),
                params.redeemableFrom(),
                params.redeemableUntil(),
                params.totalQuota(),
                params.perUserQuota(),
                effect);
    }

    protected void assertDiscountBenefit(
            RedemptionRedeemResponse response,
            BigDecimal expectedPercentage,
            LocalDateTime validFrom,
            LocalDateTime validUntil) {
        List<UserDiscountBenefit> benefits = userDiscountBenefitRepository.findAll();
        Assertions.assertThat(response.discount()).isNotNull();
        Assertions.assertThat(response.discount().percentage()).isEqualByComparingTo(expectedPercentage);
        Assertions.assertThat(benefits).hasSize(1);
        Assertions.assertThat(benefits.get(0).getDiscountPercentage()).isEqualByComparingTo(expectedPercentage);
        Assertions.assertThat(benefits.get(0).getValidFrom()).isEqualTo(validFrom);
        Assertions.assertThat(benefits.get(0).getValidUntil()).isEqualTo(validUntil);
    }

    protected LocalDateTime currentTime() {
        return LocalDateTime.now(clock);
    }

    protected record MembershipCodeParams(
            String code,
            LocalDateTime redeemableFrom,
            LocalDateTime redeemableUntil,
            int totalQuota,
            int perUserQuota,
            MembershipType membershipType,
            long extensionHours) {}

    protected record DiscountCodeParams(
            String code,
            LocalDateTime redeemableFrom,
            LocalDateTime redeemableUntil,
            int totalQuota,
            int perUserQuota,
            BigDecimal percentage,
            LocalDateTime validFrom,
            LocalDateTime validUntil) {}
}
