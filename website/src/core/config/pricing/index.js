/**
 * 背景：
 *  - 订阅定价需支持按地区与 IP 段差异化展示，前端在缺省后端接口前需有能力解析本地配置。
 * 目的：
 *  - 暴露 resolvePricing 等纯函数，将静态 JSON 配置转换为 UI 可消费的结构，便于未来替换为 API 调用。
 * 关键决策与取舍：
 *  - 采用端口-适配器思路：本模块仅关注数据解析与合并，组件通过注入的函数消费结果。
 *  - 当前未实现 CIDR/Exact 覆盖的查找，保留接口签名供后续接入后端或 Web Worker 完成。
 * 影响范围：
 *  - Preferences/Subscription 分区的价格展示逻辑，及潜在的订阅流。
 * 演进与TODO：
 *  - TODO: 补齐 IP 段覆盖、实时刷新与版本号协商等能力。
 */
import defaultPricing from "./default.json" with { type: "json" };
import cnPricing from "./regions/CN.json" with { type: "json" };
import euPricing from "./regions/EU.json" with { type: "json" };
import jpPricing from "./regions/JP.json" with { type: "json" };
import usPricing from "./regions/US.json" with { type: "json" };

const REGION_CONFIG = new Map(
  [cnPricing, euPricing, jpPricing, usPricing]
    .filter((entry) => entry && entry.country)
    .map((entry) => [entry.country.toUpperCase(), entry]),
);

const PLAN_ORDER = ["FREE", "PLUS", "PRO", "PREMIUM"];

const normalizePlan = (planId, rawPlan) => {
  if (!rawPlan) {
    return {
      id: planId,
      price: 0,
      purchase: "unavailable",
      quotas: {},
      benefits: {},
    };
  }

  return {
    id: planId,
    price: rawPlan.price ?? null,
    monthly: rawPlan.monthly ?? null,
    yearly: rawPlan.yearly ?? null,
    purchase: rawPlan.purchase ?? "direct",
    quotas: rawPlan.quotas ?? {},
    benefits: rawPlan.benefits ?? {},
  };
};

const normalizePricing = (rawPricing) => {
  if (!rawPricing || typeof rawPricing !== "object") {
    return normalizePricing(defaultPricing);
  }

  const plans = PLAN_ORDER.reduce((accumulator, planId) => {
    const normalized = normalizePlan(planId, rawPricing.plans?.[planId]);
    accumulator[planId] = normalized;
    return accumulator;
  }, {});

  return {
    country: rawPricing.country ?? null,
    regionLabel: rawPricing.regionLabel ?? null,
    currency: rawPricing.currency ?? defaultPricing.currency,
    currencySymbol: rawPricing.currencySymbol ?? defaultPricing.currencySymbol,
    taxIncluded:
      typeof rawPricing.taxIncluded === "boolean"
        ? rawPricing.taxIncluded
        : Boolean(defaultPricing.taxIncluded),
    plans,
    updatedAt: rawPricing.updatedAt ?? defaultPricing.updatedAt,
  };
};

export function resolvePricing({ regionCode } = {}) {
  const normalizedRegion =
    typeof regionCode === "string" && regionCode.trim().length > 0
      ? regionCode.trim().toUpperCase()
      : null;

  const rawPricing =
    (normalizedRegion && REGION_CONFIG.get(normalizedRegion)) || defaultPricing;

  return normalizePricing(rawPricing);
}

export function listVisiblePlans(currentPlanId) {
  const normalizedPlan =
    typeof currentPlanId === "string"
      ? currentPlanId.trim().toUpperCase()
      : null;

  const basePlans = PLAN_ORDER.slice(0, 3);
  if (normalizedPlan === "PREMIUM") {
    return PLAN_ORDER.slice();
  }
  return basePlans;
}

export function getPlanDefinition(pricing, planId) {
  if (!pricing) {
    return null;
  }
  const normalizedPlanId =
    typeof planId === "string" ? planId.trim().toUpperCase() : null;
  if (!normalizedPlanId) {
    return null;
  }
  return pricing.plans?.[normalizedPlanId] ?? null;
}

export const PLAN_SEQUENCE = PLAN_ORDER;
