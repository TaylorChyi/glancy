/**
 * 背景：
 *  - 原订阅蓝图文件同时承担格式化、文案、计划解析等多重职责，体积超限且难以维护。
 * 目的：
 *  - 作为 orchestrator 协调各子工厂，聚合翻译、定价与用户上下文，输出订阅分区所需 props。
 * 关键决策与取舍：
 *  - 采用建造者模式：核心 orchestrator + 若干纯函数工厂，保持层次清晰；
 *  - 通过独立模块（格式化工具、文案目录、计划解析）拆解遗留巨型文件，满足结构化 lint 要求；
 *  - 不在此处引入副作用，onRedeem 等交互由调用方注入，保障可测试性。
 * 影响范围：
 *  - 偏好设置页面的订阅分区与 SettingsModal 中的复用场景。
 * 演进与TODO：
 *  - TODO: 接入真实兑换 API 后，将 onRedeem 替换为实际动作，并补充状态管理。
 */

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
