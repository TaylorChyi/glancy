const PLAN_DETAILS = {
  free: { label: "Free", isPro: false },
  plus: { label: "Plus", isPro: true },
  pro: { label: "Pro", isPro: true },
  premium: { label: "Premium", isPro: true },
};

const FALLBACK_PLAN_BY_MEMBERSHIP = {
  true: "plus",
  false: "free",
};

const normalisePlanKey = (planKey) => planKey?.toLowerCase() ?? "free";

const hasPaidPlan = (user) =>
  Boolean(user?.member || user?.isPro || (user?.plan && user.plan !== "free"));

const resolvePlanKey = (user) => {
  const paid = hasPaidPlan(user);
  const rawKey = user?.plan ?? FALLBACK_PLAN_BY_MEMBERSHIP[paid];
  return normalisePlanKey(rawKey);
};

const capitalise = (value) => value.charAt(0).toUpperCase() + value.slice(1);

const resolvePlanMetadata = (planKey) => {
  const plan = PLAN_DETAILS[planKey];
  if (plan) {
    return plan;
  }

  if (!planKey) {
    return PLAN_DETAILS.free;
  }

  return { label: capitalise(planKey), isPro: planKey !== "free" };
};

export const resolvePlanDetails = (user) => {
  const username = user?.username ?? "";
  const planKey = resolvePlanKey(user);
  const { label: planLabel, isPro } = resolvePlanMetadata(planKey);

  return { username, isPro, planLabel };
};

export default PLAN_DETAILS;
