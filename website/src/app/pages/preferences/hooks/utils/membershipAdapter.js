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
