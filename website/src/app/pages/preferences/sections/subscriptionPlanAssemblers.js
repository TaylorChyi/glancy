import { getPlanDefinition } from "@core/config/pricing";

import {
  FALLBACK_VALUE,
  formatCurrency,
  formatRenewalDate,
  formatTemplateWithPair,
  formatWithTemplate,
  safeString,
} from "./subscriptionFormattingToolkit.js";

const deriveLabelConfig = (translations) => ({
  badgeCurrent: safeString(
    translations.subscriptionPlanCurrentBadge,
    "当前套餐",
  ),
  badgeSelected: safeString(
    translations.subscriptionPlanSelectedBadge,
    "已选择",
  ),
  badgeLocked: safeString(translations.subscriptionPlanLockedBadge, "仅兑换"),
  freePrice: safeString(translations.subscriptionPlanFreePrice, "免费"),
  monthlyTemplate: safeString(
    translations.subscriptionPriceMonthly,
    "{amount}/月",
  ),
  yearlyTemplate: safeString(
    translations.subscriptionPriceYearly,
    "{amount}/年",
  ),
  yearlyWithEquivalentTemplate:
    translations.subscriptionPriceYearlyWithEquivalent,
  nextRenewalTemplate: safeString(
    translations.subscriptionNextRenewalTemplate,
    "Next renewal: {value}",
  ),
});

const resolvePlanCopy = (planId, planCopy) =>
  planCopy[planId] ?? {
    title: planId,
    summary: FALLBACK_VALUE,
    cta: FALLBACK_VALUE,
  };

const shouldShowFreePrice = (plan) =>
  plan?.price === 0 && !plan?.monthly && !plan?.yearly;

const resolveMonthlyAmount = (plan, pricing) => {
  if (plan?.monthly === null || plan?.monthly === undefined) {
    return null;
  }
  return formatCurrency(plan.monthly, pricing);
};

const resolveYearlyAmount = (plan, pricing) => {
  if (plan?.yearly === null || plan?.yearly === undefined) {
    return null;
  }
  return formatCurrency(plan.yearly, pricing);
};

const buildYearlyLine = ({
  plan,
  pricing,
  yearlyAmount,
  yearlyTemplate,
  yearlyWithEquivalentTemplate,
}) => {
  if (!yearlyAmount) {
    return null;
  }
  const yearlyEquivalent = plan?.yearly
    ? formatCurrency(plan.yearly / 12, pricing)
    : null;
  if (yearlyEquivalent) {
    return formatTemplateWithPair(
      yearlyWithEquivalentTemplate,
      formatWithTemplate(yearlyTemplate, yearlyAmount),
      yearlyEquivalent,
    );
  }
  return formatWithTemplate(yearlyTemplate, yearlyAmount);
};

const derivePriceLines = ({
  plan,
  pricing,
  freePrice,
  monthlyTemplate,
  yearlyTemplate,
  yearlyWithEquivalentTemplate,
}) => {
  if (shouldShowFreePrice(plan)) {
    return [freePrice];
  }

  const lines = [];
  const monthlyAmount = resolveMonthlyAmount(plan, pricing);
  if (monthlyAmount) {
    lines.push(formatWithTemplate(monthlyTemplate, monthlyAmount));
  }

  const yearlyAmount = resolveYearlyAmount(plan, pricing);
  const yearlyLine = buildYearlyLine({
    plan,
    pricing,
    yearlyAmount,
    yearlyTemplate,
    yearlyWithEquivalentTemplate,
  });
  if (yearlyLine) {
    lines.push(yearlyLine);
  }

  return lines;
};

const derivePlanState = ({ planId, currentPlanId, purchase }) => {
  const isCurrent = planId === currentPlanId;
  const isRedeemOnly = purchase === "redeem_only" && !isCurrent;
  return { isCurrent, isRedeemOnly };
};

const resolveBadge = ({
  isCurrent,
  isRedeemOnly,
  badgeCurrent,
  badgeLocked,
  badgeSelected,
}) => {
  if (isCurrent) {
    return badgeCurrent;
  }
  if (isRedeemOnly) {
    return badgeLocked;
  }
  return badgeSelected;
};

const resolveCtaLabel = ({
  isCurrent,
  isRedeemOnly,
  badgeCurrent,
  badgeLocked,
  cta,
}) => {
  if (isCurrent) {
    return badgeCurrent;
  }
  if (isRedeemOnly) {
    return badgeLocked;
  }
  return cta;
};

const deriveSubscriptionExpiryLine = ({
  planId,
  isCurrent,
  nextRenewalDate,
  nextRenewalTemplate,
}) => {
  if (!isCurrent || planId === "FREE" || !nextRenewalDate) {
    return undefined;
  }
  const formattedRenewalDate = formatRenewalDate(nextRenewalDate);
  if (!formattedRenewalDate) {
    return undefined;
  }
  return formatWithTemplate(nextRenewalTemplate, formattedRenewalDate);
};

const createPlanCard = ({
  planId,
  planCopy,
  pricing,
  labelConfig,
  currentPlanId,
  subscriptionMeta,
}) => {
  const plan = getPlanDefinition(pricing, planId);
  const copy = resolvePlanCopy(planId, planCopy);
  const { isCurrent, isRedeemOnly } = derivePlanState({
    planId,
    currentPlanId,
    purchase: plan?.purchase,
  });
  const priceLines = derivePriceLines({
    plan,
    pricing,
    freePrice: labelConfig.freePrice,
    monthlyTemplate: labelConfig.monthlyTemplate,
    yearlyTemplate: labelConfig.yearlyTemplate,
    yearlyWithEquivalentTemplate: labelConfig.yearlyWithEquivalentTemplate,
  });
  const subscriptionExpiryLine = deriveSubscriptionExpiryLine({
    planId,
    isCurrent,
    nextRenewalDate: subscriptionMeta?.nextRenewalDate,
    nextRenewalTemplate: labelConfig.nextRenewalTemplate,
  });

  return {
    id: planId,
    title: copy.title,
    summary: copy.summary,
    priceLines,
    state: isCurrent ? "current" : isRedeemOnly ? "locked" : "available",
    badge: resolveBadge({
      isCurrent,
      isRedeemOnly,
      badgeCurrent: labelConfig.badgeCurrent,
      badgeLocked: labelConfig.badgeLocked,
      badgeSelected: labelConfig.badgeSelected,
    }),
    ctaLabel: resolveCtaLabel({
      isCurrent,
      isRedeemOnly,
      badgeCurrent: labelConfig.badgeCurrent,
      badgeLocked: labelConfig.badgeLocked,
      cta: copy.cta,
    }),
    disabled: isCurrent || isRedeemOnly,
    subscriptionExpiryLine,
  };
};

/**
 * 意图：
 *  - 根据可见套餐列表与文案资源生成订阅卡片配置。
 */
export const buildPlanCards = ({
  visiblePlanIds,
  planCopy,
  pricing,
  translations,
  currentPlanId,
  subscriptionMeta,
}) => {
  const labelConfig = deriveLabelConfig(translations);
  return visiblePlanIds.map((planId) =>
    createPlanCard({
      planId,
      planCopy,
      pricing,
      labelConfig,
      currentPlanId,
      subscriptionMeta,
    }),
  );
};

const createFeatureValues = (feature, visiblePlanIds, pricing) =>
  visiblePlanIds.reduce((accumulator, planId) => {
    const plan = getPlanDefinition(pricing, planId);
    accumulator[planId] = plan
      ? feature.resolve({ ...plan, id: planId })
      : FALLBACK_VALUE;
    return accumulator;
  }, {});

const createFeatureRow = (feature, visiblePlanIds, pricing) => ({
  id: feature.id,
  label: feature.label,
  values: createFeatureValues(feature, visiblePlanIds, pricing),
});

/**
 * 意图：依据蓝图生成二维能力矩阵，供前端表格组件消费。
 */
export const buildFeatureMatrix = ({ blueprint, visiblePlanIds, pricing }) =>
  blueprint.map((feature) =>
    createFeatureRow(feature, visiblePlanIds, pricing),
  );
