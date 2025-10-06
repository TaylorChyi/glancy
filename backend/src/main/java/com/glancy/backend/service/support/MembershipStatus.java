package com.glancy.backend.service.support;

import com.glancy.backend.entity.MembershipTier;
import com.glancy.backend.entity.User;
import java.time.Clock;
import java.time.LocalDateTime;
import java.util.Objects;

/**
 * 背景：
 *  - 会员身份的布尔字段已无法满足“等级 + 有效期”组合的业务需求；
 *  - 多个服务需要一致的判断逻辑以避免魔法值与重复代码。
 * 目的：
 *  - 以值对象表达用户会员状态，集中封装判定逻辑，便于前端展示与额度控制。
 * 关键决策与取舍：
 *  - 选择记录类型（record）以保持不可变特性，防止跨层误修改；
 *  - 将时钟 Clock 作为入参，避免对系统时间的硬耦合，后续可通过注入测试时钟覆盖边界；
 *  - 若会员等级缺失或有效期为空视为非会员，后续若引入永久会员可通过设置远期时间实现。
 * 影响范围：
 *  - 被用户查询、登录响应和限流等服务复用，确保会员判断口径一致。
 * 演进与TODO：
 *  - 后续如需区分临期状态，可扩展 additional 标志或工厂方法。
 */
public record MembershipStatus(boolean active, MembershipTier tier, LocalDateTime expiresAt) {
    public static MembershipStatus from(User user, Clock clock) {
        Objects.requireNonNull(user, "user must not be null");
        Objects.requireNonNull(clock, "clock must not be null");
        MembershipTier tier = user.getMembershipTier();
        LocalDateTime expiresAt = user.getMembershipExpiresAt();
        if (tier == null || expiresAt == null) {
            return new MembershipStatus(false, null, expiresAt);
        }
        LocalDateTime now = LocalDateTime.now(clock);
        boolean active = !expiresAt.isBefore(now);
        return new MembershipStatus(active, tier, expiresAt);
    }

    public boolean isNonMember() {
        return !active;
    }
}
