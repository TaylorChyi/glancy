package com.glancy.backend.service.redemption;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;

import com.glancy.backend.dto.redemption.DiscountEffectConfig;
import com.glancy.backend.dto.redemption.MembershipEffectConfig;
import com.glancy.backend.dto.redemption.RedemptionCodeCreateRequest;
import com.glancy.backend.dto.redemption.RedemptionEffectConfig;
import com.glancy.backend.dto.redemption.RedemptionRedeemRequest;
import com.glancy.backend.dto.redemption.RedemptionRedeemResponse;
import com.glancy.backend.entity.MembershipType;
import com.glancy.backend.entity.User;
import com.glancy.backend.entity.redemption.RedemptionCode;
import com.glancy.backend.entity.redemption.RedemptionEffectType;
import com.glancy.backend.entity.redemption.RedemptionRecord;
import com.glancy.backend.entity.redemption.UserDiscountBenefit;
import com.glancy.backend.exception.InvalidRequestException;
import com.glancy.backend.repository.RedemptionCodeRepository;
import com.glancy.backend.repository.RedemptionRecordRepository;
import com.glancy.backend.repository.UserDiscountBenefitRepository;
import com.glancy.backend.repository.UserRepository;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
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
    }
)
@Transactional
class RedemptionCodeServiceTest {

    @Autowired
    private RedemptionCodeService redemptionCodeService;

    @Autowired
    private RedemptionCodeRepository redemptionCodeRepository;

    @Autowired
    private RedemptionRecordRepository redemptionRecordRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private UserDiscountBenefitRepository userDiscountBenefitRepository;

    @BeforeEach
    void clean() {
        redemptionRecordRepository.deleteAll();
        redemptionCodeRepository.deleteAll();
        userDiscountBenefitRepository.deleteAll();
        userRepository.deleteAll();
    }

    /**
     * 测试目标：验证会员兑换码可以延长用户会员有效期。
     * 前置条件：存在无会员的用户与有效的会员兑换码。
     * 步骤：
     *  1) 创建会员类型兑换码；
     *  2) 调用兑换接口；
     * 断言：
     *  - 响应返回会员奖励信息；
     *  - 用户会员类型更新为兑换配置，且到期时间晚于当前时间。
     * 边界/异常：
     *  - 验证会员到期时间非空以覆盖会员初次开通。
     */
    @Test
    void GivenMembershipCode_WhenRedeem_ThenExtendMembership() {
        User user = persistUser("member-user");
        LocalDateTime now = LocalDateTime.now();
        RedemptionEffectConfig effect = new RedemptionEffectConfig(
            RedemptionEffectType.MEMBERSHIP,
            new MembershipEffectConfig(MembershipType.PLUS, 24L),
            null
        );
        RedemptionCodeCreateRequest createRequest = new RedemptionCodeCreateRequest(
            "VIP2024",
            now.minusHours(1),
            now.plusDays(1),
            10,
            2,
            effect
        );
        redemptionCodeService.createCode(createRequest);

        RedemptionRedeemResponse response = redemptionCodeService.redeem(
            user.getId(),
            new RedemptionRedeemRequest("VIP2024")
        );

        User refreshed = userRepository.findById(user.getId()).orElseThrow();
        assertThat(response.membership()).isNotNull();
        assertThat(response.membership().membershipType()).isEqualTo(MembershipType.PLUS);
        assertThat(refreshed.getMembershipType()).isEqualTo(MembershipType.PLUS);
        assertThat(refreshed.getMembershipExpiresAt()).isNotNull();
        assertThat(refreshed.getMembershipExpiresAt()).isAfter(now);
    }

    /**
     * 测试目标：验证兑换次数耗尽后无法再次兑换。
     * 前置条件：创建单次兑换的会员兑换码，并完成一次兑换。
     * 步骤：
     *  1) 创建兑换码；
     *  2) 首次兑换成功；
     *  3) 第二次兑换。
     * 断言：
     *  - 第二次兑换抛出 InvalidRequestException。
     * 边界/异常：
     *  - 校验异常信息包含“次数”。
     */
    @Test
    void GivenQuotaExhausted_WhenRedeem_ThenThrow() {
        User user = persistUser("quota-user");
        LocalDateTime now = LocalDateTime.now();
        RedemptionEffectConfig effect = new RedemptionEffectConfig(
            RedemptionEffectType.MEMBERSHIP,
            new MembershipEffectConfig(MembershipType.PLUS, 12L),
            null
        );
        RedemptionCodeCreateRequest createRequest = new RedemptionCodeCreateRequest(
            "LIMIT1",
            now.minusHours(1),
            now.plusDays(1),
            1,
            1,
            effect
        );
        redemptionCodeService.createCode(createRequest);
        redemptionCodeService.redeem(user.getId(), new RedemptionRedeemRequest("LIMIT1"));

        InvalidRequestException ex = assertThrows(InvalidRequestException.class, () ->
            redemptionCodeService.redeem(user.getId(), new RedemptionRedeemRequest("LIMIT1"))
        );
        assertThat(ex.getMessage()).contains("次数");
    }

    /**
     * 测试目标：验证折扣兑换会生成用户折扣权益记录。
     * 前置条件：存在用户与折扣兑换码。
     * 步骤：
     *  1) 创建折扣兑换码；
     *  2) 执行兑换；
     * 断言：
     *  - 响应返回折扣信息；
     *  - 用户折扣权益表新增一条记录。
     * 边界/异常：
     *  - 检查折扣有效期与配置一致。
     */
    @Test
    void GivenDiscountCode_WhenRedeem_ThenPersistBenefit() {
        User user = persistUser("discount-user");
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime discountFrom = now.minusHours(1);
        LocalDateTime discountUntil = now.plusDays(3);
        RedemptionEffectConfig effect = new RedemptionEffectConfig(
            RedemptionEffectType.DISCOUNT,
            null,
            new DiscountEffectConfig(BigDecimal.valueOf(20), discountFrom, discountUntil)
        );
        RedemptionCodeCreateRequest createRequest = new RedemptionCodeCreateRequest(
            "SALE20",
            now.minusHours(2),
            now.plusDays(2),
            5,
            2,
            effect
        );
        redemptionCodeService.createCode(createRequest);

        RedemptionRedeemResponse response = redemptionCodeService.redeem(
            user.getId(),
            new RedemptionRedeemRequest("SALE20")
        );

        List<UserDiscountBenefit> benefits = userDiscountBenefitRepository.findAll();
        assertThat(response.discount()).isNotNull();
        assertThat(response.discount().percentage()).isEqualByComparingTo(BigDecimal.valueOf(20));
        assertThat(benefits).hasSize(1);
        assertThat(benefits.get(0).getDiscountPercentage()).isEqualByComparingTo(BigDecimal.valueOf(20));
        assertThat(benefits.get(0).getValidFrom()).isEqualTo(discountFrom);
        assertThat(benefits.get(0).getValidUntil()).isEqualTo(discountUntil);
    }

    /**
     * 测试目标：验证历史数据中未统一大小写的兑换码仍可被识别兑换。
     * 前置条件：构造 code 字段为小写的会员兑换码。
     * 步骤：
     *  1) 持久化 legacy 兑换码并保留小写 code；
     *  2) 触发兑换流程。
     * 断言：
     *  - 返回会员权益信息不为空；
     *  - 生成一条兑换记录；
     *  - 兑换码累计次数更新为 1。
     * 边界/异常：
     *  - 覆盖大小写不一致的迁移兼容场景。
     */
    @Test
    void GivenLegacyCodeWithLowercase_WhenRedeem_ThenNormalizeAndPersistRecord() {
        User user = persistUser("legacy-user");
        LocalDateTime now = LocalDateTime.now();
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

        RedemptionRedeemResponse response = redemptionCodeService.redeem(
            user.getId(),
            new RedemptionRedeemRequest("LEGACY1")
        );

        List<RedemptionRecord> records = redemptionRecordRepository.findAll();
        RedemptionCode refreshed = redemptionCodeRepository.findById(legacy.getId()).orElseThrow();
        assertThat(response.membership()).isNotNull();
        assertThat(records).hasSize(1);
        assertThat(refreshed.getTotalRedeemed()).isEqualTo(1);
    }

    private User persistUser(String username) {
        User user = new User();
        user.setUsername(username);
        user.setPassword("password");
        user.setEmail(username + "@example.com");
        user.setPhone("1" + Math.abs(username.hashCode()));
        return userRepository.save(user);
    }
}
