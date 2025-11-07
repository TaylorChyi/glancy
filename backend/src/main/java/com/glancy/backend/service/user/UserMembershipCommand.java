package com.glancy.backend.service.user;

import com.glancy.backend.entity.MembershipType;
import com.glancy.backend.service.membership.MembershipLifecycleService;
import java.time.Clock;
import java.time.LocalDateTime;
import org.springframework.stereotype.Component;


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
