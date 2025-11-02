/**
 * 背景：
 *  - 兑换接口返回的会员奖励需要与用户上下文合并，原逻辑嵌入在主 Hook 中不利于复用。
 * 目的：
 *  - 将会员奖励映射抽离为纯函数，确保任意调用点都可使用统一策略更新用户信息。
 * 关键决策与取舍：
 *  - 约定 MEMBERSHIP_EFFECT_TYPE 常量，避免魔法字符串散落；
 *  - 合并逻辑保持幂等，当奖励缺失或非法时直接返回原对象，降低风险。
 * 影响范围：
 *  - 偏好设置页面、未来的活动兑换入口。
 * 演进与TODO：
 *  - 后续可扩展对多会员层级叠加的支持，或在此处注入埋点。
 */

export const MEMBERSHIP_EFFECT_TYPE = "MEMBERSHIP";

const normalizePlan = (membershipType) => {
  if (typeof membershipType !== "string") {
    return "";
  }
  const trimmed = membershipType.trim();
  return trimmed.length > 0 ? trimmed.toUpperCase() : "";
};

const buildSubscriptionUpdates = ({
  normalizedPlan,
  expiresAt,
  subscription,
}) => {
  const updates = {};
  if (normalizedPlan) {
    updates.planId = normalizedPlan;
    updates.currentPlanId = normalizedPlan;
    updates.tier = normalizedPlan;
  }
  if (expiresAt) {
    updates.nextRenewalDate = expiresAt;
  }
  return Object.keys(updates).length > 0
    ? { ...(subscription ?? {}), ...updates }
    : subscription;
};

export const mergeMembershipRewardIntoUser = (user, reward) => {
  if (!user || !reward) {
    return user;
  }

  const normalizedPlan = normalizePlan(reward.membershipType);
  const expiresAt = reward.expiresAt ?? null;
  const hasPaidMembership =
    normalizedPlan && normalizedPlan !== "FREE" && normalizedPlan !== "NONE";

  return {
    ...user,
    member: hasPaidMembership,
    isPro: hasPaidMembership || user.isPro === true,
    plan: normalizedPlan || user.plan,
    membershipType: reward.membershipType ?? user.membershipType,
    membershipExpiresAt: expiresAt ?? user.membershipExpiresAt ?? null,
    subscription: buildSubscriptionUpdates({
      normalizedPlan,
      expiresAt,
      subscription: user.subscription,
    }),
  };
};
