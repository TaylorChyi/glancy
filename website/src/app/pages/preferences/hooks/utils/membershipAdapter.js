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

const PAID_MEMBERSHIP_EXCLUSIONS = new Set(["FREE", "NONE", ""]);

const resolveMembershipFlags = (normalizedPlan) => {
  const hasPlan = Boolean(normalizedPlan);
  if (!hasPlan) {
    return { hasPaidMembership: false, preferredPlan: "" };
  }
  const isPaid = !PAID_MEMBERSHIP_EXCLUSIONS.has(normalizedPlan);
  return { hasPaidMembership: isPaid, preferredPlan: normalizedPlan };
};

const deriveMembershipMergePayload = ({
  user,
  reward,
  normalizedPlan,
  expiresAt,
}) => {
  const { hasPaidMembership, preferredPlan } =
    resolveMembershipFlags(normalizedPlan);

  return {
    member: hasPaidMembership,
    isPro: hasPaidMembership || user.isPro === true,
    plan: preferredPlan || user.plan,
    membershipType: reward.membershipType ?? user.membershipType,
    membershipExpiresAt: expiresAt ?? user.membershipExpiresAt ?? null,
  };
};

export const mergeMembershipRewardIntoUser = (user, reward) => {
  if (!user || !reward) {
    return user;
  }

  const normalizedPlan = normalizePlan(reward.membershipType);
  const expiresAt = reward.expiresAt ?? null;

  return {
    ...user,
    ...deriveMembershipMergePayload({
      user,
      reward,
      normalizedPlan,
      expiresAt,
    }),
    subscription: buildSubscriptionUpdates({
      normalizedPlan,
      expiresAt,
      subscription: user.subscription,
    }),
  };
};
