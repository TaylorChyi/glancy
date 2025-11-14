import { listVisiblePlans, resolvePricing } from "@core/config/pricing";

import { safeString } from "./subscriptionFormattingToolkit.js";
import {
  buildFeatureBlueprint,
  buildPlanCopy,
} from "./subscriptionCopyCatalog.js";
import {
  buildFeatureMatrix,
  buildPlanCards,
} from "./subscriptionPlanAssemblers.js";
import { resolveCurrentPlanId } from "./subscriptionProfileResolver.js";

export const resolvePricingContext = (userProfile = {}) => {
  const subscriptionMeta = userProfile.subscription ?? {};
  const currentPlanId = resolveCurrentPlanId(userProfile, {
    fallbackPlan: "FREE",
  });
  const regionCode =
    subscriptionMeta.regionCode ?? userProfile.regionCode ?? undefined;
  const pricing = resolvePricing({ regionCode });
  const visiblePlanIds = listVisiblePlans(currentPlanId);
  return { subscriptionMeta, currentPlanId, pricing, visiblePlanIds };
};

export const buildRedeemCopy = (translations = {}) => ({
  title: safeString(translations.subscriptionRedeemTitle, "兑换专享权益"),
  placeholder: safeString(
    translations.subscriptionRedeemPlaceholder,
    "请输入兑换码",
  ),
  buttonLabel: safeString(translations.subscriptionRedeemButton, "立即兑换"),
});

export const assemblePlanCards = ({
  visiblePlanIds,
  planCopy,
  pricing,
  translations,
  currentPlanId,
  subscriptionMeta,
}) =>
  buildPlanCards({
    visiblePlanIds,
    planCopy,
    pricing,
    translations,
    currentPlanId,
    subscriptionMeta,
  });

export const derivePlanLabels = (planCards) =>
  planCards.reduce((accumulator, plan) => {
    accumulator[plan.id] = plan.title;
    return accumulator;
  }, {});

export const deriveSectionNotes = (pricing, translations = {}) => ({
  taxNote: pricing.taxIncluded
    ? safeString(translations.pricingTaxIncluded, "价格已含税")
    : safeString(translations.pricingTaxExcluded, "价格不含税"),
  pricingNote: safeString(
    translations.pricingFixedNote,
    "本地区价格为固定面额，不随汇率波动调整。",
  ),
});

export const composeSectionPayload = ({
  translations,
  planCards,
  featureMatrix,
  visiblePlanIds,
  planLabels,
  notes,
  redeemCopy,
  currentPlanId,
  onRedeem,
}) => ({
  title: safeString(translations.settingsTabSubscription, "订阅"),
  featureColumnLabel: safeString(
    translations.subscriptionFeatureColumnLabel,
    "能力项",
  ),
  planCards,
  featureMatrix,
  visiblePlanIds,
  planLabels,
  pricingNote: notes.pricingNote,
  taxNote: notes.taxNote,
  redeemCopy,
  defaultSelectedPlanId: currentPlanId,
  onRedeem,
});

export const buildFeatureMatrixForPlans = (context, translations) =>
  buildFeatureMatrix({
    blueprint: buildFeatureBlueprint(translations),
    visiblePlanIds: context.visiblePlanIds,
    pricing: context.pricing,
  });

export function buildSubscriptionSectionProps({
  translations,
  user,
  onRedeem,
}) {
  const t = translations ?? {};
  const context = resolvePricingContext(user ?? {});
  const planCopy = buildPlanCopy(t);
  const planCards = assemblePlanCards({
    ...context,
    planCopy,
    translations: t,
  });
  const featureMatrix = buildFeatureMatrixForPlans(context, t);
  return composeSectionPayload({
    translations: t,
    planCards,
    featureMatrix,
    visiblePlanIds: context.visiblePlanIds,
    planLabels: derivePlanLabels(planCards),
    notes: deriveSectionNotes(context.pricing, t),
    redeemCopy: buildRedeemCopy(t),
    currentPlanId: context.currentPlanId,
    onRedeem,
  });
}
