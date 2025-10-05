/**
 * 背景：
 *  - 订阅分区需要组合定价、配额与文案，避免在 UI 层硬编码业务常量。
 * 目的：
 *  - 将地区定价、套餐元数据与多语言文案整合为可直接渲染的视图模型。
 * 关键决策与取舍：
 *  - 采用模板方法模式：本模块负责数据整形，渲染交给 SubscriptionSection；
 *  - 数字统一在此格式化，减少组件重复逻辑并便于未来接入货币/本地化策略。
 * 影响范围：
 *  - 偏好设置页订阅分区、后续可能复用订阅视图的模态组件。
 * 演进与TODO：
 *  - TODO: 接入真实兑换状态与地区识别逻辑；
 *  - TODO: 支持更多套餐字段（如限时优惠、加购）。
 */

import { SUBSCRIPTION_PLAN_ORDER } from "@/config/subscription.js";

const FALLBACK_PLAN = "FREE";
const DISPLAY_PLAN_ORDER = SUBSCRIPTION_PLAN_ORDER;

const PLAN_COPY_KEYS = Object.freeze({
  FREE: {
    titleKey: "plan.free.title",
    summaryKey: "plan.free.desc",
    ctaKey: "subscription.plan.free.cta",
  },
  PLUS: {
    titleKey: "plan.plus.title",
    summaryKey: "plan.plus.desc",
    ctaKey: "subscription.plan.plus.cta",
  },
  PRO: {
    titleKey: "plan.pro.title",
    summaryKey: "plan.pro.desc",
    ctaKey: "subscription.plan.pro.cta",
  },
  PREMIUM: {
    titleKey: "plan.premium.title",
    summaryKey: "plan.premium.desc",
    ctaKey: "subscription.plan.premium.cta",
  },
});

const PRIORITY_LABEL_KEYS = Object.freeze({
  standard: "subscription.priority.standard",
  elevated: "subscription.priority.elevated",
  high: "subscription.priority.high",
  highest: "subscription.priority.highest",
});

const DATA_TOOL_KEYS = Object.freeze({
  "export-only": "subscription.datatools.exportOnly",
  "import-export": "subscription.datatools.importExport",
  "import-export-api": "subscription.datatools.importExportApi",
});

const HISTORY_LABEL_KEYS = Object.freeze({
  days: "subscription.history.days",
  year: "subscription.history.year",
  unlimited: "subscription.history.unlimited",
});

const BETA_ACCESS_LABEL_KEYS = Object.freeze({
  none: "subscription.beta.none",
  optin: "subscription.beta.optin",
  default: "subscription.beta.default",
  priority: "subscription.beta.priority",
});

const YES_NO_KEYS = Object.freeze({
  true: "subscription.boolean.yes",
  false: "subscription.boolean.no",
});

const FEATURE_BLUEPRINT = Object.freeze([
  {
    id: "wordLookupsDaily",
    labelKey: "subscription.feature.wordLookupsDaily",
    valueType: "dailyQuota",
    values: {
      FREE: { amount: 50 },
      PLUS: { amount: 500 },
      PRO: { amount: 5000 },
      PREMIUM: { amount: 20000, softLimit: true },
    },
  },
  {
    id: "llmCallsDaily",
    labelKey: "subscription.feature.llmCallsDaily",
    valueType: "dailyQuota",
    values: {
      FREE: { amount: 10 },
      PLUS: { amount: 200 },
      PRO: { amount: 2000 },
      PREMIUM: { amount: 20000, softLimit: true },
    },
  },
  {
    id: "ttsDaily",
    labelKey: "subscription.feature.ttsDaily",
    valueType: "dailyQuota",
    values: {
      FREE: { amount: 50 },
      PLUS: { amount: 1000 },
      PRO: { amount: 10000 },
      PREMIUM: { amount: 100000 },
    },
  },
  {
    id: "vocabularySize",
    labelKey: "subscription.feature.vocabularySize",
    valueType: "plainNumber",
    values: {
      FREE: { amount: 1000 },
      PLUS: { amount: 5000 },
      PRO: { amount: 50000 },
      PREMIUM: { amount: 500000 },
    },
  },
  {
    id: "bilingualExamples",
    labelKey: "subscription.feature.bilingualExamples",
    valueType: "languages",
    values: {
      FREE: { amount: 2 },
      PLUS: { amount: 5 },
      PRO: { amount: 10 },
      PREMIUM: { amount: 20 },
    },
  },
  {
    id: "ocrMonthly",
    labelKey: "subscription.feature.ocrMonthly",
    valueType: "monthlyQuota",
    values: {
      FREE: { amount: 0 },
      PLUS: { amount: 50 },
      PRO: { amount: 500 },
      PREMIUM: { amount: 5000 },
    },
  },
  {
    id: "pdfMonthly",
    labelKey: "subscription.feature.pdfMonthly",
    valueType: "monthlyQuota",
    values: {
      FREE: { amount: 0 },
      PLUS: { amount: 50 },
      PRO: { amount: 500 },
      PREMIUM: { amount: 5000 },
    },
  },
  {
    id: "concurrency",
    labelKey: "subscription.feature.concurrency",
    valueType: "plainNumber",
    values: {
      FREE: { amount: 1 },
      PLUS: { amount: 2 },
      PRO: { amount: 5 },
      PREMIUM: { amount: 10 },
    },
  },
  {
    id: "priority",
    labelKey: "subscription.feature.priority",
    valueType: "priority",
    values: {
      FREE: { level: "standard" },
      PLUS: { level: "elevated" },
      PRO: { level: "high" },
      PREMIUM: { level: "highest" },
    },
  },
  {
    id: "devices",
    labelKey: "subscription.feature.devices",
    valueType: "plainNumber",
    values: {
      FREE: { amount: 2 },
      PLUS: { amount: 3 },
      PRO: { amount: 5 },
      PREMIUM: { amount: 10 },
    },
  },
  {
    id: "ads",
    labelKey: "subscription.feature.ads",
    valueType: "boolean",
    values: {
      FREE: { value: false },
      PLUS: { value: true },
      PRO: { value: true },
      PREMIUM: { value: true },
    },
  },
  {
    id: "dataTools",
    labelKey: "subscription.feature.dataTools",
    valueType: "dataTools",
    values: {
      FREE: { variant: "export-only" },
      PLUS: { variant: "import-export" },
      PRO: { variant: "import-export-api" },
      PREMIUM: { variant: "import-export-api" },
    },
  },
  {
    id: "historyRetention",
    labelKey: "subscription.feature.historyRetention",
    valueType: "history",
    values: {
      FREE: { mode: "days", amount: 30 },
      PLUS: { mode: "days", amount: 180 },
      PRO: { mode: "year", amount: 1 },
      PREMIUM: { mode: "unlimited" },
    },
  },
  {
    id: "beta",
    labelKey: "subscription.feature.beta",
    valueType: "beta",
    values: {
      FREE: { level: "none" },
      PLUS: { level: "optin" },
      PRO: { level: "default" },
      PREMIUM: { level: "priority" },
    },
  },
  {
    id: "support",
    labelKey: "subscription.feature.support",
    valueType: "support",
    values: {
      FREE: { hours: 72 },
      PLUS: { hours: 48 },
      PRO: { hours: 24 },
      PREMIUM: { hours: 12 },
    },
  },
]);

const NUMBER_FORMATTER_CACHE = new Map();

function getNumberFormatter(locale, options) {
  const cacheKey = JSON.stringify({ locale, options });
  if (NUMBER_FORMATTER_CACHE.has(cacheKey)) {
    return NUMBER_FORMATTER_CACHE.get(cacheKey);
  }
  const formatter = new Intl.NumberFormat(locale, options);
  NUMBER_FORMATTER_CACHE.set(cacheKey, formatter);
  return formatter;
}

function formatNumber(locale, amount) {
  if (typeof amount !== "number" || Number.isNaN(amount)) {
    return "";
  }
  return getNumberFormatter(locale, { maximumFractionDigits: 0 }).format(amount);
}

function formatCurrency({ amount, currency, locale }) {
  if (typeof amount !== "number" || Number.isNaN(amount)) {
    return "";
  }
  return getNumberFormatter(locale, {
    style: "currency",
    currency,
    maximumFractionDigits: currency === "JPY" ? 0 : 2,
  }).format(amount);
}

function normalizePlanId(candidate) {
  if (!candidate || typeof candidate !== "string") {
    return FALLBACK_PLAN;
  }
  const upper = candidate.toUpperCase();
  if (DISPLAY_PLAN_ORDER.includes(upper)) {
    return upper;
  }
  return FALLBACK_PLAN;
}

function formatFeatureValue({
  blueprint,
  planId,
  locale,
  t,
}) {
  const value = blueprint.values[planId];
  if (!value) {
    return t?.subscriptionValueUnavailable || "—";
  }

  switch (blueprint.valueType) {
    case "dailyQuota": {
      const formatted = formatNumber(locale, value.amount);
      if (!formatted) {
        return t?.subscriptionValueUnavailable || "—";
      }
      const base = t?.subscriptionValuePerDay?.replace("{{value}}", formatted) ?? `${formatted}/day`;
      if (value.softLimit) {
        return `${base}${t?.subscriptionValueSoftLimit ?? ""}`;
      }
      return base;
    }
    case "monthlyQuota": {
      if (!value.amount) {
        return t?.subscriptionValueNone ?? "None";
      }
      const formatted = formatNumber(locale, value.amount);
      return t?.subscriptionValuePerMonth?.replace("{{value}}", formatted) ?? `${formatted}/month`;
    }
    case "plainNumber": {
      const formatted = formatNumber(locale, value.amount);
      return formatted || t?.subscriptionValueNone || "—";
    }
    case "languages": {
      const formatted = formatNumber(locale, value.amount);
      return (
        t?.subscriptionValueLanguages?.replace("{{value}}", formatted) ?? `${formatted} languages`
      );
    }
    case "priority": {
      const key = PRIORITY_LABEL_KEYS[value.level] || PRIORITY_LABEL_KEYS.standard;
      return t?.[key] ?? value.level ?? "";
    }
    case "boolean": {
      const key = YES_NO_KEYS[String(Boolean(value.value))];
      return t?.[key] ?? String(Boolean(value.value));
    }
    case "dataTools": {
      const key = DATA_TOOL_KEYS[value.variant];
      return t?.[key] ?? value.variant ?? "";
    }
    case "history": {
      if (value.mode === "unlimited") {
        return t?.[HISTORY_LABEL_KEYS.unlimited] ?? "Unlimited";
      }
      const formatted = formatNumber(locale, value.amount);
      const key = HISTORY_LABEL_KEYS[value.mode] || HISTORY_LABEL_KEYS.days;
      return t?.[key]?.replace("{{value}}", formatted) ?? `${formatted}`;
    }
    case "beta": {
      const key = BETA_ACCESS_LABEL_KEYS[value.level] || BETA_ACCESS_LABEL_KEYS.none;
      return t?.[key] ?? value.level ?? "";
    }
    case "support": {
      const formatted = formatNumber(locale, value.hours);
      return t?.subscriptionValueSupport?.replace("{{value}}", formatted) ?? `${formatted}h`;
    }
    default:
      return t?.subscriptionValueUnavailable || "—";
  }
}

function buildPlanCard({ planId, pricing, t, locale, currentPlanId }) {
  const metadata = PLAN_COPY_KEYS[planId];
  const title = metadata ? t?.[metadata.titleKey] ?? planId : planId;
  const summary = metadata ? t?.[metadata.summaryKey] ?? "" : "";
  const planPricing = pricing?.plans?.[planId] ?? {};

  const isRedeemOnly = planPricing?.purchase === "redeem_only";
  const monthlyLabel = typeof planPricing.monthly === "number"
    ? t?.subscriptionPriceMonthly?.replace(
        "{{value}}",
        formatCurrency({ amount: planPricing.monthly, currency: pricing.currency, locale }),
      )
    : planId === "FREE"
      ? t?.subscriptionPriceFree ?? "Free"
      : undefined;

  const yearlyLabel = typeof planPricing.yearly === "number"
    ? t?.subscriptionPriceYearly?.replace(
        "{{value}}",
        formatCurrency({ amount: planPricing.yearly, currency: pricing.currency, locale }),
      )
    : undefined;

  const yearlyEquivalent = typeof planPricing.yearly === "number" && planPricing.yearly > 0
    ? t?.subscriptionPriceYearlyEquivalent?.replace(
        "{{value}}",
        formatCurrency({
          amount: planPricing.yearly / 12,
          currency: pricing.currency,
          locale,
        }),
      )
    : undefined;

  const ctaLabel = metadata
    ? t?.[metadata.ctaKey] ?? ""
    : "";
  const isCurrent = planId === currentPlanId;

  const buttonLabel = isCurrent
    ? t?.subscriptionPlanCurrent ?? "Current"
    : isRedeemOnly
      ? t?.subscriptionPlanRedeemOnly ?? "Redeem only"
      : ctaLabel;

  const disabled = isCurrent || isRedeemOnly;

  return {
    id: planId,
    title,
    summary,
    monthlyLabel,
    yearlyLabel,
    yearlyEquivalent,
    buttonLabel,
    isCurrent,
    disabled,
    isRedeemOnly,
    badgeLabel: isCurrent ? t?.subscriptionPlanCurrentBadge ?? t?.subscriptionPlanCurrent ?? "Current" : undefined,
    highlight: isCurrent,
  };
}

function buildFeatureMatrix({ locale, t, planIds }) {
  return FEATURE_BLUEPRINT.map((feature) => {
    const row = { id: feature.id, label: t?.[feature.labelKey] ?? feature.labelKey, values: {} };
    planIds.forEach((planId) => {
      row.values[planId] = formatFeatureValue({
        blueprint: feature,
        planId,
        locale,
        t,
      });
    });
    return row;
  });
}

function buildFaqEntries({ t, pricing }) {
  const entries = [];
  if (t?.subscriptionFaqFixed) {
    entries.push(t.subscriptionFaqFixed);
  }
  if (pricing?.taxIncluded !== undefined) {
    entries.push(
      pricing.taxIncluded
        ? t?.subscriptionFaqTaxIncluded
        : t?.subscriptionFaqTaxExcluded,
    );
  }
  if (t?.subscriptionFaqAutoRenew) {
    entries.push(t.subscriptionFaqAutoRenew);
  }
  if (t?.subscriptionFaqInvoice) {
    entries.push(t.subscriptionFaqInvoice);
  }
  if (t?.subscriptionFaqRefund && typeof pricing?.refundWindowDays === "number") {
    entries.push(t.subscriptionFaqRefund.replace("{{days}}", String(pricing.refundWindowDays)));
  }
  if (t?.subscriptionFaqSupport) {
    entries.push(t.subscriptionFaqSupport);
  }
  return entries.filter(Boolean);
}

function buildCurrentPlanCard({
  t,
  currentPlanId,
  pricing,
  user,
  locale,
}) {
  const metadata = PLAN_COPY_KEYS[currentPlanId];
  const title = metadata ? t?.[metadata.titleKey] ?? currentPlanId : currentPlanId;
  const billingCycle =
    user?.subscription?.billingCycle || user?.billingCycle || t?.subscriptionCurrentCycleFallback;
  const nextRenewal = user?.subscription?.nextRenewalDate || user?.nextRenewalDate;
  const nextRenewalLabel = nextRenewal
    ? t?.subscriptionMetaNextRenewal?.replace("{{date}}", nextRenewal)
    : t?.subscriptionMetaNextRenewalPending;

  const regionLabel = user?.subscription?.regionLabel || pricing?.regionLabel || "";
  const currencyLabel = user?.subscription?.currency || pricing?.currency || "";

  const validity = user?.subscription?.validUntil
    ? t?.subscriptionMetaValidUntil?.replace("{{date}}", user.subscription.validUntil)
    : user?.subscription?.validUnlimited
      ? t?.subscriptionMetaValidUnlimited
      : undefined;

  const premiumHighlight = currentPlanId === "PREMIUM" ? t?.subscriptionPremiumHighlight : undefined;

  const cycleLabel = billingCycle || "";
  const headlineTemplate = t?.subscriptionCurrentHeadline || "{{plan}} · {{cycle}}";
  const headline = headlineTemplate
    .replace("{{plan}}", title)
    .replace("{{cycle}}", cycleLabel);

  return {
    title,
    headline,
    cycle: cycleLabel,
    nextRenewal: nextRenewalLabel,
    region: regionLabel,
    currency: currencyLabel,
    validity,
    highlight: premiumHighlight,
    manageLabel: t?.subscriptionActionManage,
    changeRegionLabel: t?.subscriptionActionChangeRegion,
    redeemLabel: t?.subscriptionActionRedeem,
    showRedeem: currentPlanId !== "PREMIUM",
  };
}

export function createSubscriptionViewModel({
  t,
  pricing,
  user,
  locale = "zh-CN",
}) {
  const resolvedPlanId = normalizePlanId(user?.plan);
  const planIds = resolvedPlanId === "PREMIUM"
    ? DISPLAY_PLAN_ORDER
    : DISPLAY_PLAN_ORDER.filter((planId) => planId !== "PREMIUM");

  const plans = planIds.map((planId) =>
    buildPlanCard({
      planId,
      pricing,
      t,
      locale,
      currentPlanId: resolvedPlanId,
    }),
  );

  const features = buildFeatureMatrix({ locale, t, planIds });
  const faqEntries = buildFaqEntries({ t, pricing });
  const current = buildCurrentPlanCard({
    t,
    currentPlanId: resolvedPlanId,
    pricing,
    user,
    locale,
  });

  return {
    title: t?.settingsTabSubscription ?? "Subscription",
    description: t?.settingsSubscriptionDescription ?? "Manage how you subscribe to Glancy.",
    plans,
    features,
    faqEntries,
    current,
    defaultSelection: resolvedPlanId,
    planIds,
    pricing,
    labels: {
      planMatrixTitle: t?.subscriptionMatrixTitle ?? "Plans",
      featureLabel: t?.subscriptionMatrixFeature ?? "Feature",
      faqTitle: t?.subscriptionFaqTitle ?? "FAQ",
      redeemTitle: t?.subscriptionRedeemTitle ?? "Redeem access",
      redeemPlaceholder: t?.subscriptionRedeemPlaceholder ?? "Enter code",
      redeemSubmit: t?.subscriptionRedeemSubmit ?? "Redeem",
      subscribeTitle: t?.subscriptionSubscribeTitle ?? "Subscribe",
      subscribeCta: t?.subscriptionSubscribeCta ?? "Go to subscription",
      subscribeDisabled: t?.subscriptionSubscribeDisabled ?? "Already on this plan",
      billingCycleLabel: t?.subscriptionMetaBillingCycle ?? "Billing cycle",
      nextRenewalLabel: t?.subscriptionMetaNextRenewalLabel ?? "Next renewal",
      regionLabel: t?.subscriptionMetaRegionLabel ?? "Region",
      currencyLabel: t?.subscriptionMetaCurrencyLabel ?? "Currency",
      validityLabel: t?.subscriptionMetaValidityLabel ?? "Validity",
    },
  };
}

export default createSubscriptionViewModel;
