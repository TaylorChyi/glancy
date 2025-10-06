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

/**
 * 背景：
 *  - 会员兑换需要复用会员领域服务以保持状态一致。
 * 目的：
 *  - 通过策略实现会员延长，并返回统一的领域结果。
 * 关键决策与取舍：
 *  - 使用 MembershipLifecycleService，避免在策略内直接操作仓储；
 *  - 若未配置延长时长，直接抛出业务异常防止脏数据。
 * 影响范围：
 *  - 兑换服务根据返回结果装配 DTO。
 * 演进与TODO：
 *  - 后续可支持叠加不同会员等级策略，例如按优先级选择更高等级。
 */
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
        MembershipSnapshot snapshot = membershipLifecycleService.extendMembership(
            user.getId(),
            code.getMembershipType(),
            extension,
            redemptionTime
        );
        return RedemptionOutcome.forMembership(snapshot);
    }
}
