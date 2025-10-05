/**
 * 背景：
 *  - 订阅页面此前缺乏统一的套餐数据来源，组件层不得不写死价格与权益，后续迭代成本高且易与后端配置脱节。
 * 目的：
 *  - 聚合订阅蓝图、特性矩阵与地区定价，返回给 UI 一个语义化的数据模型，同时保留未来接入服务端 API 的扩展点。
 * 关键决策与取舍：
 *  - 采用策略模式中的“数据提供者”角色：Hook 内只负责解析配置，不处理界面状态或副作用；
 *  - 维持纯函数式输出，使组件在测试时可以通过注入 regionCode 和当前套餐模拟不同状态。
 * 影响范围：
 *  - 偏好设置页的订阅分区、后续的升级弹窗均可依赖该 Hook 获取一致的数据。
 * 演进与TODO：
 *  - TODO: 接入 IP → 地区的识别逻辑，并支持后端覆盖配置；
 *  - TODO: 当套餐扩展至企业版时，可在 SUBSCRIPTION_PLAN_BLUEPRINT 中追加 order 排序即可被此 Hook 感知。
 */
import { useMemo } from "react";
import {
  SUBSCRIPTION_FEATURE_MATRIX,
  SUBSCRIPTION_PLAN_BLUEPRINT,
  SUBSCRIPTION_POLICY_COPY_KEYS,
  SUBSCRIPTION_REGIONAL_PRICING,
} from "@/config";

const formatMonthly = (value) => {
  if (value === undefined || value === null) {
    return "";
  }
  return Number.parseFloat(value.toString());
};

const deriveYearlyEquiv = (yearly) => {
  if (yearly === undefined || yearly === null) {
    return "";
  }
  const numeric = Number.parseFloat(yearly.toString());
  if (Number.isNaN(numeric)) {
    return "";
  }
  return Number.parseFloat((numeric / 12).toFixed(2));
};

const pickRegionConfig = (regionCode) => {
  if (regionCode && SUBSCRIPTION_REGIONAL_PRICING[regionCode]) {
    return SUBSCRIPTION_REGIONAL_PRICING[regionCode];
  }
  return SUBSCRIPTION_REGIONAL_PRICING.default;
};

const buildPlanCards = (blueprint, regionConfig, currentPlanId) => {
  const items = blueprint
    .slice()
    .sort((a, b) => a.order - b.order)
    .filter((plan) => !plan.hiddenByDefault || plan.id === currentPlanId);

  return items.map((plan) => {
    const pricing = regionConfig?.plans?.[plan.id] ?? {};
    const monthly = formatMonthly(pricing.monthly ?? pricing.price);
    const yearly = pricing.yearly ? Number.parseFloat(pricing.yearly.toString()) : "";
    const yearlyEquivalent = yearly !== "" ? deriveYearlyEquiv(yearly) : "";

    return {
      id: plan.id,
      tier: plan.tier,
      labelKey: plan.labelKey,
      descriptionKey: plan.descriptionKey,
      actionKey: plan.actionKey,
      purchaseType: plan.purchaseType,
      monthly,
      yearly,
      yearlyEquivalent,
      isCurrent: plan.id === currentPlanId,
    };
  });
};

const deriveFeatureMatrix = (blueprint, features, currentPlanId) => {
  const visiblePlans = new Set(
    blueprint
      .filter((plan) => !plan.hiddenByDefault || plan.id === currentPlanId)
      .map((plan) => plan.id),
  );

  return features.map((feature) => {
    const filteredValues = Object.entries(feature.values).reduce(
      (acc, [planId, value]) => {
        if (!visiblePlans.has(planId)) {
          return acc;
        }
        acc[planId] = value;
        return acc;
      },
      {},
    );
    return {
      id: feature.id,
      labelKey: feature.labelKey,
      unitKey: feature.unitKey,
      values: filteredValues,
    };
  });
};

function useSubscriptionPlans({ regionCode, currentPlanId }) {
  return useMemo(() => {
    const regionConfig = pickRegionConfig(regionCode);
    const plans = buildPlanCards(
      SUBSCRIPTION_PLAN_BLUEPRINT,
      regionConfig,
      currentPlanId,
    );
    const featureMatrix = deriveFeatureMatrix(
      SUBSCRIPTION_PLAN_BLUEPRINT,
      SUBSCRIPTION_FEATURE_MATRIX,
      currentPlanId,
    );

    return {
      plans,
      featureMatrix,
      region: {
        country: regionConfig.country,
        regionLabel: regionConfig.regionLabel,
        currency: regionConfig.currency,
        currencySymbol: regionConfig.currencySymbol,
        taxIncluded: Boolean(regionConfig.taxIncluded),
        policies: regionConfig.policies || {},
      },
      policyCopy: SUBSCRIPTION_POLICY_COPY_KEYS,
    };
  }, [currentPlanId, regionCode]);
}

export default useSubscriptionPlans;
