package com.glancy.backend.dto.redemption;

import com.glancy.backend.entity.MembershipType;
import java.time.LocalDateTime;


public record MembershipRewardResponse(MembershipType membershipType, LocalDateTime expiresAt) {}
