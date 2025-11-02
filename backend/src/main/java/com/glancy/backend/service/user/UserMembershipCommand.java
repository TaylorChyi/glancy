package com.glancy.backend.service.user;

import com.glancy.backend.entity.MembershipType;
import com.glancy.backend.service.membership.MembershipLifecycleService;
import java.time.Clock;
import java.time.LocalDateTime;
import org.springframework.stereotype.Component;

/**
 * 背景：
 *  - 会员激活与移除逻辑散落在 UserService 中，难以扩展审计或特性开关。
 * 目的：
 *  - 通过命令处理器集中封装会员生命周期变更，并统一时间来源。
 * 关键决策与取舍：
 *  - 注入 Clock 以便测试与未来支持可控时间；
 *  - 继续复用 MembershipLifecycleService 承载领域规则。
 * 影响范围：
 *  - 会员激活、移除 API 的实现迁移至此。
 * 演进与TODO：
 *  - 可在此扩展会员类型策略或事件通知。
 */
@Component
public class UserMembershipCommand {

    private final MembershipLifecycleService membershipLifecycleService;
    private final Clock clock;

    public UserMembershipCommand(MembershipLifecycleService membershipLifecycleService, Clock clock) {
        this.membershipLifecycleService = membershipLifecycleService;
        this.clock = clock;
    }

    /**
     * 意图：激活会员身份。
     */
    public void activateMembership(Long userId, MembershipType membershipType, LocalDateTime expiresAt) {
        membershipLifecycleService.activateMembership(userId, membershipType, expiresAt, LocalDateTime.now(clock));
    }

    /**
     * 意图：移除会员身份。
     */
    public void removeMembership(Long userId) {
        membershipLifecycleService.removeMembership(userId, LocalDateTime.now(clock));
    }
}
