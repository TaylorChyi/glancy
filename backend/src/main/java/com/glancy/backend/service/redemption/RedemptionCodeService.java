package com.glancy.backend.service.redemption;

import com.glancy.backend.dto.redemption.DiscountEffectConfig;
import com.glancy.backend.dto.redemption.DiscountRewardResponse;
import com.glancy.backend.dto.redemption.MembershipEffectConfig;
import com.glancy.backend.dto.redemption.MembershipRewardResponse;
import com.glancy.backend.dto.redemption.RedemptionCodeCreateRequest;
import com.glancy.backend.dto.redemption.RedemptionCodeResponse;
import com.glancy.backend.dto.redemption.RedemptionEffectConfig;
import com.glancy.backend.dto.redemption.RedemptionRedeemRequest;
import com.glancy.backend.dto.redemption.RedemptionRedeemResponse;
import com.glancy.backend.entity.User;
import com.glancy.backend.entity.redemption.RedemptionCode;
import com.glancy.backend.entity.redemption.RedemptionEffectType;
import com.glancy.backend.entity.redemption.RedemptionRecord;
import com.glancy.backend.exception.DuplicateResourceException;
import com.glancy.backend.exception.InvalidRequestException;
import com.glancy.backend.exception.ResourceNotFoundException;
import com.glancy.backend.repository.RedemptionCodeRepository;
import com.glancy.backend.repository.RedemptionRecordRepository;
import com.glancy.backend.repository.UserRepository;
import com.glancy.backend.service.membership.MembershipSnapshot;
import com.glancy.backend.service.redemption.effect.RedemptionEffectProcessor;
import com.glancy.backend.service.redemption.model.RedemptionOutcome;
import java.time.Clock;
import java.time.LocalDateTime;
import java.util.EnumMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.OptimisticLockingFailureException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
public class RedemptionCodeService {

    private final RedemptionCodeRepository redemptionCodeRepository;
    private final RedemptionRecordRepository redemptionRecordRepository;
    private final UserRepository userRepository;
    private final Map<RedemptionEffectType, RedemptionEffectProcessor> processorRegistry;
    private final Clock clock;

    public RedemptionCodeService(
        RedemptionCodeRepository redemptionCodeRepository,
        RedemptionRecordRepository redemptionRecordRepository,
        UserRepository userRepository,
        List<RedemptionEffectProcessor> processors,
        Clock clock
    ) {
        this.redemptionCodeRepository = redemptionCodeRepository;
        this.redemptionRecordRepository = redemptionRecordRepository;
        this.userRepository = userRepository;
        this.processorRegistry = new EnumMap<>(RedemptionEffectType.class);
        processors.forEach(p -> this.processorRegistry.put(p.supportedType(), p));
        this.clock = clock;
    }

    /** 意图：创建新的兑换码配置。 */
    @Transactional
    public RedemptionCodeResponse createCode(RedemptionCodeCreateRequest request) {
        validateTimeRange(request.redeemableFrom(), request.redeemableUntil());
        if (request.perUserQuota() > request.totalQuota()) {
            throw new InvalidRequestException("单用户兑换次数不可超过总次数");
        }
        String normalizedCode = normalizeCode(request.code());
        redemptionCodeRepository
            .findByCodeAndDeletedFalse(normalizedCode)
            .ifPresent(c -> {
                throw new DuplicateResourceException("兑换码已存在");
            });
        RedemptionCode code = new RedemptionCode();
        code.setCode(normalizedCode);
        code.setRedeemableFrom(request.redeemableFrom());
        code.setRedeemableUntil(request.redeemableUntil());
        code.setTotalQuota(request.totalQuota());
        code.setPerUserQuota(request.perUserQuota());
        applyEffectConfig(code, request.effect());
        RedemptionCode saved = redemptionCodeRepository.save(code);
        return toResponse(saved);
    }

    /** 意图：根据编码查询兑换码。 */
    public RedemptionCodeResponse findByCode(String code) {
        RedemptionCode redemptionCode = redemptionCodeRepository
            .findByCodeAndDeletedFalse(normalizeCode(code))
            .orElseThrow(() -> new ResourceNotFoundException("兑换码不存在"));
        return toResponse(redemptionCode);
    }

    /** 意图：执行兑换流程并返回权益结果。 */
    @Transactional
    public RedemptionRedeemResponse redeem(Long userId, RedemptionRedeemRequest request) {
        RedemptionCode code = findActiveCode(request.code());
        LocalDateTime now = LocalDateTime.now(clock);
        validateRedeemWindow(code, now);
        validateUserQuota(userId, code);
        User user = loadUser(userId);
        RedemptionOutcome outcome = resolveProcessor(code).process(code, user, now);
        persistUsage(code, user, now);
        return buildRedeemResponse(code, outcome);
    }

    private RedemptionCode findActiveCode(String rawCode) {
        return redemptionCodeRepository
            .findByCodeAndDeletedFalse(normalizeCode(rawCode))
            .orElseThrow(() -> new ResourceNotFoundException("兑换码不存在"));
    }

    private void validateRedeemWindow(RedemptionCode code, LocalDateTime now) {
        if (!code.isRedeemableAt(now)) {
            throw new InvalidRequestException("兑换未在有效期内");
        }
        if (!code.hasRemainingQuota()) {
            throw new InvalidRequestException("兑换次数已用尽");
        }
    }

    private void validateUserQuota(Long userId, RedemptionCode code) {
        long redeemed = redemptionRecordRepository.countByCodeIdAndUserIdAndDeletedFalse(code.getId(), userId);
        if (redeemed >= code.getPerUserQuota()) {
            throw new InvalidRequestException("已超过个人兑换次数");
        }
    }

    private User loadUser(Long userId) {
        return userRepository.findById(userId).orElseThrow(() -> new ResourceNotFoundException("用户不存在"));
    }

    private RedemptionEffectProcessor resolveProcessor(RedemptionCode code) {
        return Optional.ofNullable(processorRegistry.get(code.getEffectType())).orElseThrow(() ->
            new InvalidRequestException("不支持的兑换效果")
        );
    }

    private void persistUsage(RedemptionCode code, User user, LocalDateTime now) {
        code.increaseRedemptionCount();
        try {
            redemptionCodeRepository.save(code);
        } catch (OptimisticLockingFailureException ex) {
            throw new InvalidRequestException("兑换冲突，请稍后重试");
        }
        RedemptionRecord record = new RedemptionRecord();
        record.setCode(code);
        record.setUser(user);
        record.setRedeemedAt(now);
        redemptionRecordRepository.save(record);
    }

    private RedemptionRedeemResponse buildRedeemResponse(RedemptionCode code, RedemptionOutcome outcome) {
        return new RedemptionRedeemResponse(
            code.getCode(),
            code.getEffectType(),
            outcome.membership().map(this::toMembershipRewardResponse).orElse(null),
            outcome
                .discountPercentageOptional()
                .map(discount ->
                    new DiscountRewardResponse(discount, outcome.discountValidFrom(), outcome.discountValidUntil())
                )
                .orElse(null)
        );
    }

    private void applyEffectConfig(RedemptionCode entity, RedemptionEffectConfig effect) {
        RedemptionEffectType type = effect.type();
        entity.setEffectType(type);
        if (type == RedemptionEffectType.MEMBERSHIP) {
            MembershipEffectConfig membership = Optional.ofNullable(effect.membership()).orElseThrow(() ->
                new InvalidRequestException("会员兑换需配置会员参数")
            );
            if (membership.extensionHours() > Integer.MAX_VALUE) {
                throw new InvalidRequestException("会员延长时长超出系统上限");
            }
            entity.setMembershipType(membership.membershipType());
            entity.setMembershipExtensionHours(Math.toIntExact(membership.extensionHours()));
            entity.setDiscountPercentage(null);
            entity.setDiscountValidFrom(null);
            entity.setDiscountValidUntil(null);
        } else if (type == RedemptionEffectType.DISCOUNT) {
            DiscountEffectConfig discount = Optional.ofNullable(effect.discount()).orElseThrow(() ->
                new InvalidRequestException("折扣兑换需配置折扣参数")
            );
            validateTimeRange(discount.validFrom(), discount.validUntil());
            entity.setDiscountPercentage(discount.percentage());
            entity.setDiscountValidFrom(discount.validFrom());
            entity.setDiscountValidUntil(discount.validUntil());
            entity.setMembershipType(null);
            entity.setMembershipExtensionHours(null);
        } else {
            throw new InvalidRequestException("未知的兑换效果类型");
        }
    }

    private MembershipRewardResponse toMembershipRewardResponse(MembershipSnapshot snapshot) {
        return new MembershipRewardResponse(snapshot.type(), snapshot.expiresAt());
    }

    private RedemptionCodeResponse toResponse(RedemptionCode code) {
        MembershipEffectConfig membership = null;
        if (code.getEffectType() == RedemptionEffectType.MEMBERSHIP) {
            long extensionHours = code.getMembershipExtensionHours() == null
                ? 0L
                : code.getMembershipExtensionHours().longValue();
            membership = new MembershipEffectConfig(code.getMembershipType(), extensionHours);
        }
        DiscountEffectConfig discount = null;
        if (code.getEffectType() == RedemptionEffectType.DISCOUNT && code.getDiscountPercentage() != null) {
            discount = new DiscountEffectConfig(
                code.getDiscountPercentage(),
                code.getDiscountValidFrom(),
                code.getDiscountValidUntil()
            );
        }
        return new RedemptionCodeResponse(
            code.getCode(),
            code.getRedeemableFrom(),
            code.getRedeemableUntil(),
            code.getTotalQuota(),
            code.getPerUserQuota(),
            code.getTotalRedeemed(),
            code.getEffectType(),
            membership,
            discount
        );
    }

    private String normalizeCode(String code) {
        if (code == null) {
            throw new InvalidRequestException("兑换码不能为空");
        }
        String trimmed = code.trim();
        if (trimmed.isEmpty()) {
            throw new InvalidRequestException("兑换码不能为空");
        }
        return trimmed.toUpperCase(Locale.ROOT);
    }

    private void validateTimeRange(LocalDateTime start, LocalDateTime end) {
        if (start == null || end == null) {
            throw new InvalidRequestException("时间范围不能为空");
        }
        if (!end.isAfter(start)) {
            throw new InvalidRequestException("结束时间需晚于开始时间");
        }
    }
}
