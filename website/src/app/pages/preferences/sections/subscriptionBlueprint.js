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

export function buildSubscriptionSectionProps({
  translations,
  user,
  onRedeem,
}) {
  const t = translations ?? {};
  const userProfile = user ?? {};
  const subscriptionMeta = userProfile.subscription ?? {};
  const currentPlanId = resolveCurrentPlanId(userProfile, {
    fallbackPlan: "FREE",
  });
  const regionCode =
    subscriptionMeta.regionCode ?? userProfile.regionCode ?? undefined;
  const pricing = resolvePricing({ regionCode });
  const visiblePlanIds = listVisiblePlans(currentPlanId);
  const planCopy = buildPlanCopy(t);
  const planCards = buildPlanCards({
    visiblePlanIds,
    planCopy,
    pricing,
    translations: t,
    currentPlanId,
    subscriptionMeta,
  });

  const featureBlueprint = buildFeatureBlueprint(t);
  const featureMatrix = buildFeatureMatrix({
    blueprint: featureBlueprint,
    visiblePlanIds,
    pricing,
  });

  const taxNote = pricing.taxIncluded
    ? safeString(t.pricingTaxIncluded, "价格已含税")
    : safeString(t.pricingTaxExcluded, "价格不含税");

  const redeemCopy = {
    title: safeString(t.subscriptionRedeemTitle, "兑换专享权益"),
    placeholder: safeString(t.subscriptionRedeemPlaceholder, "请输入兑换码"),
    buttonLabel: safeString(t.subscriptionRedeemButton, "立即兑换"),
  };

  const pricingNote = safeString(
    t.pricingFixedNote,
    "本地区价格为固定面额，不随汇率波动调整。",
  );

  return {
    title: safeString(t.settingsTabSubscription, "订阅"),
    featureColumnLabel: safeString(t.subscriptionFeatureColumnLabel, "能力项"),
    planCards,
    featureMatrix,
    visiblePlanIds,
    planLabels: planCards.reduce((accumulator, plan) => {
      accumulator[plan.id] = plan.title;
      return accumulator;
    }, {}),
    pricingNote,
    taxNote,
    redeemCopy,
    defaultSelectedPlanId: currentPlanId,
    onRedeem,
  };
}
