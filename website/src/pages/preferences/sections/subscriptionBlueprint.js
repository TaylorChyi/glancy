/**
 * 背景：
 *  - 订阅分区的展示需要同时组合地区定价、套餐权益与用户上下文，直接在组件内拼装会导致逻辑不可维护。
 * 目的：
 *  - 提供建造者函数，接入配置与翻译资源后生成 SubscriptionSection 所需的全部 props。
 * 关键决策与取舍：
 *  - 采用建造者模式集中整理文案与格式化逻辑，组件保持纯展示；拒绝在组件内硬编码套餐或数值。
 * 影响范围：
 *  - Preferences 页及 SettingsModal 中的订阅分区，未来扩展兑换与订阅流程时亦可复用本构造器。
 * 演进与TODO：
 *  - TODO: 接入真实兑换/订阅 API 后，将 onRedeem/onSubscribe 替换为实际动作，并补充状态管理。
 */
import {
  getPlanDefinition,
  listVisiblePlans,
  resolvePricing,
} from "@/config/pricing";

const FALLBACK_VALUE = "—";

const safeString = (value, fallback = FALLBACK_VALUE) => {
  if (typeof value !== "string") {
    return fallback;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : fallback;
};

const formatWithTemplate = (template, value) => {
  if (!template) {
    return value ?? FALLBACK_VALUE;
  }
  return template.replace("{value}", value ?? FALLBACK_VALUE);
};

const formatTemplateWithPair = (template, amount, equivalent) => {
  if (!template) {
    return `${amount ?? FALLBACK_VALUE}`;
  }
  return template
    .replace("{amount}", amount ?? FALLBACK_VALUE)
    .replace("{equivalent}", equivalent ?? FALLBACK_VALUE);
};

const formatCurrency = (amount, { currency, currencySymbol }) => {
  if (amount === null || amount === undefined) {
    return null;
  }
  const numeric = Number(amount);
  if (Number.isNaN(numeric)) {
    return null;
  }
  const maximumFractionDigits = currency === "JPY" ? 0 : 2;
  const isInteger = Number.isInteger(numeric);
  const formatted = numeric.toLocaleString(undefined, {
    minimumFractionDigits: isInteger ? 0 : Math.min(2, maximumFractionDigits),
    maximumFractionDigits,
  });
  return `${currencySymbol ?? ""}${formatted}`.trim();
};

const formatQuota = (value, template, { zeroLabel, softLimitNote } = {}) => {
  if (value === null || value === undefined) {
    return zeroLabel ?? FALLBACK_VALUE;
  }
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric <= 0) {
    return zeroLabel ?? FALLBACK_VALUE;
  }
  const formatted = numeric.toLocaleString();
  const withTemplate = formatWithTemplate(template, formatted);
  return softLimitNote ? `${withTemplate}${softLimitNote}` : withTemplate;
};

const translateByMap = (translations, mapping, key, fallback = FALLBACK_VALUE) => {
  if (!key) {
    return fallback;
  }
  const normalized = String(key).trim();
  const translationKey = mapping[normalized];
  if (!translationKey) {
    return fallback;
  }
  return safeString(translations[translationKey], fallback);
};

const PRIORITY_KEY_MAP = {
  standard: "subscriptionPriorityStandard",
  higher: "subscriptionPriorityHigher",
  high: "subscriptionPriorityHigh",
  highest: "subscriptionPriorityHighest",
};

const BULK_EXPORT_KEY_MAP = {
  "export-only": "subscriptionBulkExportExportOnly",
  "import-export": "subscriptionBulkExportImportExport",
  "import-export-api": "subscriptionBulkExportImportExportApi",
};

const BETA_ACCESS_KEY_MAP = {
  no: "subscriptionBetaAccessNo",
  apply: "subscriptionBetaAccessApply",
  default: "subscriptionBetaAccessDefault",
  priority: "subscriptionBetaAccessPriority",
};

const BOOL_VALUE_MAP = {
  true: "subscriptionValueYes",
  false: "subscriptionValueNo",
};

const buildPlanCopy = (t) => ({
  FREE: {
    title: safeString(t.subscriptionPlanFreeTitle, "FREE"),
    summary: safeString(t.subscriptionPlanFreeSummary, FALLBACK_VALUE),
    cta: safeString(t.subscriptionPlanFreeCta, FALLBACK_VALUE),
  },
  PLUS: {
    title: safeString(t.subscriptionPlanPlusTitle, "PLUS"),
    summary: safeString(t.subscriptionPlanPlusSummary, FALLBACK_VALUE),
    cta: safeString(t.subscriptionPlanPlusCta, FALLBACK_VALUE),
  },
  PRO: {
    title: safeString(t.subscriptionPlanProTitle, "PRO"),
    summary: safeString(t.subscriptionPlanProSummary, FALLBACK_VALUE),
    cta: safeString(t.subscriptionPlanProCta, FALLBACK_VALUE),
  },
  PREMIUM: {
    title: safeString(t.subscriptionPlanPremiumTitle, "PREMIUM"),
    summary: safeString(t.subscriptionPlanPremiumSummary, FALLBACK_VALUE),
    cta: safeString(t.subscriptionPlanPremiumCta, FALLBACK_VALUE),
  },
});

const buildFeatureBlueprint = (t) => {
  const softLimitNote = safeString(t.subscriptionSoftLimitNote, "");
  const zeroLabel = safeString(t.subscriptionValueNone, FALLBACK_VALUE);
  const unavailable = safeString(t.subscriptionValueUnavailable, FALLBACK_VALUE);
  const historyTemplate = safeString(
    t.subscriptionHistoryRetentionTemplate,
    "{value}",
  );
  const historyUnlimited = safeString(
    t.subscriptionHistoryRetentionUnlimited,
    FALLBACK_VALUE,
  );
  const supportTemplate = safeString(
    t.subscriptionSupportSloTemplate,
    "{value}",
  );

  return [
    {
      id: "wordLookupsDaily",
      label: safeString(
        t.subscriptionFeatureWordLookupsDaily,
        "每日查词上限",
      ),
      resolve: (plan) =>
        formatQuota(plan.quotas?.wordLookupsDaily, t.subscriptionUnitTimesPerDay, {
          zeroLabel,
          softLimitNote:
            plan.id === "PREMIUM" && softLimitNote ? ` ${softLimitNote}` : "",
        }),
    },
    {
      id: "llmCallsDaily",
      label: safeString(t.subscriptionFeatureAiCallsDaily, "AI 调用"),
      resolve: (plan) =>
        formatQuota(plan.quotas?.llmCallsDaily, t.subscriptionUnitTimesPerDay, {
          zeroLabel,
          softLimitNote:
            plan.id === "PREMIUM" && softLimitNote ? ` ${softLimitNote}` : "",
        }),
    },
    {
      id: "ttsDaily",
      label: safeString(t.subscriptionFeatureTtsDaily, "TTS 发音"),
      resolve: (plan) =>
        formatQuota(plan.quotas?.ttsDaily, t.subscriptionUnitTimesPerDay, {
          zeroLabel,
          softLimitNote:
            plan.id === "PREMIUM" && softLimitNote ? ` ${softLimitNote}` : "",
        }),
    },
    {
      id: "notebookCapacity",
      label: safeString(
        t.subscriptionFeatureNotebookCapacity,
        "生词本容量",
      ),
      resolve: (plan) =>
        formatQuota(plan.quotas?.notebookCapacity, t.subscriptionUnitItems, {
          zeroLabel,
        }),
    },
    {
      id: "alignedLanguages",
      label: safeString(
        t.subscriptionFeatureAlignedLanguages,
        "多语对齐例句",
      ),
      resolve: (plan) =>
        formatQuota(plan.quotas?.alignedLanguages, t.subscriptionUnitLanguages, {
          zeroLabel,
        }),
    },
    {
      id: "ocrPagesMonthly",
      label: safeString(t.subscriptionFeatureOcrPages, "OCR / 图片取词"),
      resolve: (plan) =>
        formatQuota(plan.quotas?.ocrPagesMonthly, t.subscriptionUnitPagesPerMonth, {
          zeroLabel: unavailable,
        }),
    },
    {
      id: "pdfPagesMonthly",
      label: safeString(t.subscriptionFeaturePdfPages, "PDF 取词"),
      resolve: (plan) =>
        formatQuota(plan.quotas?.pdfPagesMonthly, t.subscriptionUnitPagesPerMonth, {
          zeroLabel: unavailable,
        }),
    },
    {
      id: "concurrentRequests",
      label: safeString(
        t.subscriptionFeatureConcurrentRequests,
        "并发请求数",
      ),
      resolve: (plan) =>
        formatQuota(
          plan.quotas?.concurrentRequests,
          t.subscriptionUnitConcurrent,
          {
            zeroLabel,
          },
        ),
    },
    {
      id: "priority",
      label: safeString(t.subscriptionFeaturePriority, "队列优先级"),
      resolve: (plan) =>
        translateByMap(t, PRIORITY_KEY_MAP, plan.benefits?.priority, FALLBACK_VALUE),
    },
    {
      id: "devices",
      label: safeString(t.subscriptionFeatureDevices, "设备数"),
      resolve: (plan) =>
        formatQuota(plan.quotas?.devices, t.subscriptionUnitDevices, {
          zeroLabel,
        }),
    },
    {
      id: "adFree",
      label: safeString(t.subscriptionFeatureAdFree, "去广告"),
      resolve: (plan) =>
        translateByMap(
          t,
          BOOL_VALUE_MAP,
          String(Boolean(plan.benefits?.adFree)),
          FALLBACK_VALUE,
        ),
    },
    {
      id: "bulkExport",
      label: safeString(t.subscriptionFeatureBulkExport, "批量导入/导出"),
      resolve: (plan) =>
        translateByMap(
          t,
          BULK_EXPORT_KEY_MAP,
          plan.benefits?.bulkExport,
          FALLBACK_VALUE,
        ),
    },
    {
      id: "historyRetentionDays",
      label: safeString(
        t.subscriptionFeatureHistoryRetention,
        "历史记录保留",
      ),
      resolve: (plan) => {
        const value = plan.benefits?.historyRetentionDays;
        if (typeof value !== "number") {
          return FALLBACK_VALUE;
        }
        if (value < 0) {
          return historyUnlimited;
        }
        if (value === 0) {
          return unavailable;
        }
        return formatWithTemplate(historyTemplate, value.toLocaleString());
      },
    },
    {
      id: "betaAccess",
      label: safeString(t.subscriptionFeatureBetaAccess, "Beta 内测通道"),
      resolve: (plan) =>
        translateByMap(
          t,
          BETA_ACCESS_KEY_MAP,
          plan.benefits?.betaAccess,
          FALLBACK_VALUE,
        ),
    },
    {
      id: "supportSloHours",
      label: safeString(t.subscriptionFeatureSupportSlo, "客服响应 SLO"),
      resolve: (plan) => {
        const hours = plan.benefits?.supportSloHours;
        if (typeof hours !== "number" || hours <= 0) {
          return FALLBACK_VALUE;
        }
        return formatWithTemplate(supportTemplate, hours.toLocaleString());
      },
    },
  ];
};

const buildPlanCards = ({
  visiblePlanIds,
  planCopy,
  pricing,
  translations,
  currentPlanId,
}) => {
  const badgeCurrent = safeString(
    translations.subscriptionPlanCurrentBadge,
    "当前套餐",
  );
  const badgeSelected = safeString(
    translations.subscriptionPlanSelectedBadge,
    "已选择",
  );
  const badgeLocked = safeString(
    translations.subscriptionPlanLockedBadge,
    "仅兑换",
  );
  const freePrice = safeString(
    translations.subscriptionPlanFreePrice,
    "免费",
  );
  const monthlyTemplate = safeString(
    translations.subscriptionPriceMonthly,
    "{amount}/月",
  );
  const yearlyTemplate = safeString(
    translations.subscriptionPriceYearly,
    "{amount}/年",
  );
  const yearlyWithEquivalentTemplate = translations.subscriptionPriceYearlyWithEquivalent;

  return visiblePlanIds.map((planId) => {
    const plan = getPlanDefinition(pricing, planId);
    const copy = planCopy[planId] ?? {
      title: planId,
      summary: FALLBACK_VALUE,
      cta: FALLBACK_VALUE,
    };

    let priceLines = [];
    if (plan?.price === 0 && !plan?.monthly && !plan?.yearly) {
      priceLines = [freePrice];
    } else {
      const monthlyAmount =
        plan?.monthly !== null && plan?.monthly !== undefined
          ? formatCurrency(plan.monthly, pricing)
          : null;
      const yearlyAmount =
        plan?.yearly !== null && plan?.yearly !== undefined
          ? formatCurrency(plan.yearly, pricing)
          : null;
      if (monthlyAmount) {
        priceLines.push(formatWithTemplate(monthlyTemplate, monthlyAmount));
      }
      if (yearlyAmount) {
        const yearlyEquivalent = plan?.yearly
          ? formatCurrency(plan.yearly / 12, pricing)
          : null;
        const yearlyLine = yearlyEquivalent
          ? formatTemplateWithPair(
              yearlyWithEquivalentTemplate,
              formatWithTemplate(yearlyTemplate, yearlyAmount),
              yearlyEquivalent,
            )
          : formatWithTemplate(yearlyTemplate, yearlyAmount);
        priceLines.push(yearlyLine);
      }
    }

    const isCurrent = planId === currentPlanId;
    const isRedeemOnly = plan?.purchase === "redeem_only" && !isCurrent;

    const badge = isCurrent
      ? badgeCurrent
      : isRedeemOnly
        ? badgeLocked
        : badgeSelected;

    const ctaLabel = isCurrent
      ? badgeCurrent
      : isRedeemOnly
        ? badgeLocked
        : copy.cta;

    return {
      id: planId,
      title: copy.title,
      summary: copy.summary,
      priceLines,
      state: isCurrent ? "current" : isRedeemOnly ? "locked" : "available",
      badge,
      ctaLabel,
      disabled: isCurrent || isRedeemOnly,
    };
  });
};

const buildFeatureMatrix = ({
  blueprint,
  visiblePlanIds,
  pricing,
}) =>
  blueprint.map((feature) => ({
    id: feature.id,
    label: feature.label,
    values: visiblePlanIds.reduce((accumulator, planId) => {
      const plan = getPlanDefinition(pricing, planId);
      if (!plan) {
        accumulator[planId] = FALLBACK_VALUE;
        return accumulator;
      }
      accumulator[planId] = feature.resolve({ ...plan, id: planId });
      return accumulator;
    }, {}),
  }));

export function buildSubscriptionSectionProps({
  translations,
  user,
  onRedeem,
  onSubscribe,
}) {
  const t = translations ?? {};
  const userProfile = user ?? {};
  const currentPlanId = safeString(
    userProfile.plan ? String(userProfile.plan).toUpperCase() : "FREE",
    "FREE",
  );
  const subscriptionMeta = userProfile.subscription ?? {};
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
  });

  const featureBlueprint = buildFeatureBlueprint(t);
  const featureMatrix = buildFeatureMatrix({
    blueprint: featureBlueprint,
    visiblePlanIds,
    pricing,
  });

  const billingCycle = safeString(
    subscriptionMeta.billingCycle === "yearly"
      ? t.subscriptionBillingCycleYearly
      : t.subscriptionBillingCycleMonthly,
    FALLBACK_VALUE,
  );

  const currentPlanCopy = planCopy[currentPlanId] ?? { title: currentPlanId };
  const planLine = `${currentPlanCopy.title} · ${billingCycle}`;
  const nextRenewalLabel = subscriptionMeta.nextRenewalDate
    ? formatWithTemplate(
        safeString(t.subscriptionNextRenewalTemplate, "下次扣费：{value}"),
        subscriptionMeta.nextRenewalDate,
      )
    : FALLBACK_VALUE;
  const regionLabel = subscriptionMeta.regionLabel ?? pricing.regionLabel;
  const regionLine = formatWithTemplate(
    safeString(t.subscriptionRegionLineTemplate, "地区：{value}"),
    regionLabel
      ? `${regionLabel} · ${pricing.currency}`
      : `${pricing.currency}`,
  );

  const premiumHighlight =
    currentPlanId === "PREMIUM"
      ? safeString(
          t.subscriptionPremiumHighlight,
          "已解锁最高级配额与优先级",
        )
      : null;

  const taxNote = pricing.taxIncluded
    ? safeString(t.pricingTaxIncluded, "价格已含税")
    : safeString(t.pricingTaxExcluded, "价格不含税");

  const currentTitle = safeString(
    t.subscriptionCurrentTitle,
    "当前订阅",
  );

  const actions = [
    {
      id: "manage",
      label: safeString(t.subscriptionActionManage, "管理订阅"),
      onClick: typeof onSubscribe === "function" ? () => onSubscribe(currentPlanId) : undefined,
    },
    {
      id: "upgrade",
      label: safeString(t.subscriptionActionUpgrade, "升级"),
      onClick: undefined,
    },
    {
      id: "downgrade",
      label: safeString(t.subscriptionActionDowngrade, "降级"),
      onClick: undefined,
    },
    {
      id: "change-region",
      label: safeString(t.subscriptionActionChangeRegion, "切换地区"),
      onClick: undefined,
    },
    {
      id: "redeem",
      label: safeString(t.subscriptionActionRedeem, "兑换码"),
      onClick: typeof onRedeem === "function" ? () => onRedeem("focus") : undefined,
    },
  ];

  const redeemCopy = {
    title: safeString(t.subscriptionRedeemTitle, "兑换专享权益"),
    placeholder: safeString(
      t.subscriptionRedeemPlaceholder,
      "请输入兑换码",
    ),
    buttonLabel: safeString(t.subscriptionRedeemButton, "立即兑换"),
  };

  const subscribeCopy = {
    template: safeString(
      t.subscriptionSubscribeButtonTemplate,
      "订阅 {plan}",
    ),
    disabledLabel: safeString(
      t.subscriptionSubscribeButtonDisabled,
      "已是当前套餐",
    ),
  };

  const pricingNote = safeString(
    t.pricingFixedNote,
    "本地区价格为固定面额，不随汇率波动调整。",
  );

  return {
    title: safeString(t.settingsTabSubscription, "订阅"),
    featureColumnLabel: safeString(
      t.subscriptionFeatureColumnLabel,
      "能力项",
    ),
    currentPlanCard: {
      title: currentTitle,
      planLine,
      nextRenewalLabel,
      regionLine,
      premiumHighlight,
      actions,
    },
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
    subscribeCopy,
    defaultSelectedPlanId: currentPlanId,
    onRedeem,
    onSubscribe,
  };
}
