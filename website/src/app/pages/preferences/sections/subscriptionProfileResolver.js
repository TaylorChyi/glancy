import { PLAN_SEQUENCE } from "@core/config/pricing";

const KNOWN_PLAN_IDS = new Set(PLAN_SEQUENCE);

const normalizePlanToken = (value) => {
  if (typeof value !== "string") {
    return null;
  }
  const trimmed = value.trim();
  return trimmed ? trimmed.toUpperCase() : null;
};

const collectPlanCandidates = (userProfile = {}) => {
  const subscriptionMeta = userProfile.subscription ?? {};
  return [
    subscriptionMeta.planId,
    subscriptionMeta.currentPlanId,
    subscriptionMeta.plan,
    subscriptionMeta.tier,
    userProfile.plan,
  ]
    .map(normalizePlanToken)
    .filter(Boolean);
};

const appendMembershipFallback = (candidates, userProfile = {}) => {
  if (userProfile.member === true) {
    return [...candidates, "PLUS"];
  }
  return candidates;
};

export const selectPlanId = (candidates, fallbackPlan) => {
  for (const candidate of candidates) {
    if (KNOWN_PLAN_IDS.has(candidate)) {
      return candidate;
    }
  }
  return fallbackPlan;
};

/**
 * 意图：
 *  - 根据用户上下文提炼订阅套餐标识，兼容历史字段与未来扩展。
 * 输入：
 *  - userProfile: 可能来自登录或偏好接口的用户对象；
 *  - defaults: 覆盖默认套餐的配置（目前仅暴露 fallbackPlan）。
 * 输出：
 *  - 归一化后的套餐 ID（FREE/PLUS/PRO/PREMIUM）。
 * 流程：
 *  1) 收集 subscription.planId 等候选字段并标准化为大写；
 *  2) 若存在会员布尔标记，将默认 PLUS 作为兜底候选；
 *  3) 返回首个命中已知套餐序列的值，否则回退到 fallbackPlan。
 * 错误处理：
 *  - 对于非字符串或未知取值，自动忽略并继续尝试下一候选。
 */
export const resolveCurrentPlanId = (
  userProfile,
  { fallbackPlan = "FREE" } = {},
) => {
  const profile = userProfile ?? {};
  const candidates = appendMembershipFallback(
    collectPlanCandidates(profile),
    profile,
  );
  return selectPlanId(candidates, fallbackPlan);
};
