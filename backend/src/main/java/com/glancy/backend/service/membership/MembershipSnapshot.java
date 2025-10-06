package com.glancy.backend.service.membership;

import com.glancy.backend.entity.MembershipType;
import com.glancy.backend.entity.User;
import java.time.LocalDateTime;

/**
 * 背景：
 *  - 兑换与用户接口需要返回会员最新状态。
 * 目的：
 *  - 作为领域内聚合快照，供上层转换为 DTO。
 * 关键决策与取舍：
 *  - 采用 record 持有最小必要信息。
 * 影响范围：
 *  - 会员服务及兑换策略的返回值。
 * 演进与TODO：
 *  - 可增加会员来源、最近变更时间等字段。
 */
public record MembershipSnapshot(MembershipType type, LocalDateTime expiresAt, boolean active) {
    public static MembershipSnapshot fromUser(User user, LocalDateTime evaluationTime) {
        return new MembershipSnapshot(
            user.getMembershipType(),
            user.getMembershipExpiresAt(),
            user.hasActiveMembershipAt(evaluationTime)
        );
    }
}
