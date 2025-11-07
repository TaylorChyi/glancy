package com.glancy.backend.service.membership;

import com.glancy.backend.entity.MembershipType;
import com.glancy.backend.entity.User;
import java.time.LocalDateTime;


public record MembershipSnapshot(MembershipType type, LocalDateTime expiresAt, boolean active) {
    public static MembershipSnapshot fromUser(User user, LocalDateTime evaluationTime) {
        return new MembershipSnapshot(
            user.getMembershipType(),
            user.getMembershipExpiresAt(),
            user.hasActiveMembershipAt(evaluationTime)
        );
    }
}
