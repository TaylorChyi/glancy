package com.glancy.backend.dto.redemption;

import com.glancy.backend.entity.MembershipType;
import java.time.LocalDateTime;

/**
 * 背景：
 *  - 前端需要展示会员延长结果。
 * 目的：
 *  - 返回兑换后会员等级与到期时间。
 * 关键决策与取舍：
 *  - 返回延长后到期时间，以便客户端更新状态。
 * 影响范围：
 *  - 兑换结果响应。
 * 演进与TODO：
 *  - 可增加剩余时长等派生信息。
 */
public record MembershipRewardResponse(MembershipType membershipType, LocalDateTime expiresAt) {}
