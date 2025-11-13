const PLAN_LABELS = {
  free: "Free",
  plus: "Plus",
  pro: "Pro",
  premium: "Premium",
};

const normalisePlanKey = (planKey) => planKey?.toLowerCase() ?? "free";

export const resolvePlanDetails = (user) => {
  const username = user?.username ?? "";
  const hasPaidPlan = Boolean(
    user?.member || user?.isPro || (user?.plan && user.plan !== "free"),
  );
  const planKey = normalisePlanKey(user?.plan ?? (hasPaidPlan ? "plus" : "free"));
  const planLabel = PLAN_LABELS[planKey] ?? `${planKey.charAt(0).toUpperCase()}${planKey.slice(1)}`;

  return { username, isPro: hasPaidPlan || planKey !== "free", planLabel };
};

export default PLAN_LABELS;
