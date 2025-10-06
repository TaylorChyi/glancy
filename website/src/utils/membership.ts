/**
 * 背景：
 *  - 后端新增会员等级与有效期字段后，前端仍存在 member 布尔值等历史遗留逻辑；
 *  - 多处组件需根据统一口径判断会员态与展示文案，若分散判断将导致行为不一致。
 * 目的：
 *  - 将会员态解析下沉到单一模块，以策略化方式兼容旧字段并为后续扩展留口。
 * 关键决策与取舍：
 *  - 采用纯函数输出不可变快照，避免在 Store 中持久化派生状态；
 *  - 当仅存在布尔字段时回退到 PLUS 作为默认付费档，以满足历史数据兼容；
 *  - 对无效的有效期字符串采取安全降级，防止因解析失败导致前端崩溃。
 * 影响范围：
 *  - Header、Sidebar、订阅偏好等需要会员信息的组件均复用该模块，减少重复代码。
 * 演进与TODO：
 *  - TODO: 后续可扩展返回“即将到期”状态或多地区套餐映射，支持更多 UI 提示。
 */

export type MembershipTier = "PLUS" | "PRO" | "PREMIUM";
export type MembershipPlanId = "FREE" | MembershipTier;

export interface MembershipSnapshot {
  active: boolean;
  tier: MembershipTier | null;
  expiresAt: string | null;
  planId: MembershipPlanId;
}

interface MembershipLike {
  member?: boolean | null;
  membershipTier?: string | null;
  membershipExpiresAt?: string | null;
  plan?: string | null;
}

const KNOWN_TIERS: MembershipTier[] = ["PLUS", "PRO", "PREMIUM"];

const normalizeTier = (tier?: string | null): MembershipTier | null => {
  if (typeof tier !== "string") {
    return null;
  }
  const normalized = tier.trim().toUpperCase();
  return KNOWN_TIERS.includes(normalized as MembershipTier)
    ? (normalized as MembershipTier)
    : null;
};

const normalizeExpiry = (expiresAt?: string | null): string | null => {
  if (typeof expiresAt !== "string") {
    return null;
  }
  const trimmed = expiresAt.trim();
  if (!trimmed) {
    return null;
  }
  const candidate = new Date(trimmed);
  if (Number.isNaN(candidate.getTime())) {
    return null;
  }
  return trimmed;
};

export function deriveMembershipSnapshot(
  user: MembershipLike | null | undefined,
  now: Date = new Date(),
): MembershipSnapshot {
  const tier = normalizeTier(user?.membershipTier);
  const expiresAt = normalizeExpiry(user?.membershipExpiresAt);

  let active = false;
  if (tier && expiresAt) {
    const expiresAtTime = new Date(expiresAt).getTime();
    active = expiresAtTime >= now.getTime();
  }

  if (!active && user?.member === true) {
    active = true;
  }

  const resolvedTier: MembershipTier | null = active ? (tier ?? "PLUS") : tier;

  const planId: MembershipPlanId = resolvedTier ?? "FREE";

  return {
    active,
    tier: resolvedTier,
    expiresAt,
    planId,
  };
}
