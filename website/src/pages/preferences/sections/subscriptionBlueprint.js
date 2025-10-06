/**
 * 背景：
 *  - 订阅分区的展示需要同时组合地区定价、套餐权益与用户上下文，直接在组件内拼装会导致逻辑不可维护。
 * 目的：
 *  - 提供建造者函数，接入配置与翻译资源后生成 SubscriptionSection 所需的全部 props。
 * 关键决策与取舍：
 *  - 采用建造者模式集中整理文案与格式化逻辑，组件保持纯展示；拒绝在组件内硬编码套餐或数值。
 * 影响范围：
 *  - Preferences 页及 SettingsModal 中的订阅分区，未来扩展兑换流程时亦可复用本构造器。
 * 演进与TODO：
 *  - TODO: 接入真实兑换 API 后，将 onRedeem 替换为实际动作，并补充状态管理。
 */
import {
  PLAN_SEQUENCE,
  getPlanDefinition,
  listVisiblePlans,
  resolvePricing,
} from "@/config/pricing";
import { deriveMembershipSnapshot } from "@/utils/membership";

const FALLBACK_VALUE = "—";

const safeString = (value, fallback = FALLBACK_VALUE) => {
  if (typeof value !== "string") {
    return fallback;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : fallback;
};

const normalizeDisplayValue = (value, fallback = FALLBACK_VALUE) => {
  if (value === null || value === undefined) {
    return fallback;
  }
  const stringified = `${value}`.trim();
  return stringified.length > 0 ? stringified : fallback;
};

/**
 * 意图：在订阅文案中统一处理 {value}/{amount}/{equivalent} 等占位符，避免组件散落手写替换。
 * 输入：
 *  - template: 允许为空的字符串模板；
 *  - replacements: 需要注入模板的键值对，自动兼容大小写及 value↔amount 同名映射；
 *  - fallbackValue: 占位符缺失或模板无效时的兜底文案。
 * 输出：
 *  - 插值后的最终字符串。
 * 流程：
 *  1) 模板为空或非字符串时直接返回 fallbackValue；
 *  2) 使用单个正则遍历 {token} 占位符；
 *  3) 兼容 token 的原始/大小写形式，并在 value/amount 间互为后备，未命中时回退 fallbackValue。
 * 错误处理：
 *  - 不抛出异常，任何非法输入均退化为 fallbackValue，保障界面稳定。
 * 复杂度：O(n)，其中 n 为模板长度。
 */
const interpolateTemplate = (
  template,
  replacements,
  fallbackValue = FALLBACK_VALUE,
) => {
  if (typeof template !== "string" || template.trim().length === 0) {
    return fallbackValue;
  }

  const resolvedFallback = normalizeDisplayValue(fallbackValue, FALLBACK_VALUE);
  const candidatePairs = new Map();

  Object.entries(replacements ?? {}).forEach(([key, value]) => {
    if (!key) {
      return;
    }
    candidatePairs.set(key, value);
    candidatePairs.set(key.toLowerCase(), value);
    candidatePairs.set(key.toUpperCase(), value);
  });

  return template.replace(/\{(\w+)\}/g, (_match, token) => {
    if (candidatePairs.has(token)) {
      return normalizeDisplayValue(candidatePairs.get(token), resolvedFallback);
    }
    if (token === "value" && candidatePairs.has("amount")) {
      return normalizeDisplayValue(
        candidatePairs.get("amount"),
        resolvedFallback,
      );
    }
    if (token === "amount" && candidatePairs.has("value")) {
      return normalizeDisplayValue(
        candidatePairs.get("value"),
        resolvedFallback,
      );
    }
    return resolvedFallback;
  });
};

const formatWithTemplate = (template, value) => {
  const fallback = normalizeDisplayValue(value, FALLBACK_VALUE);
  if (!template) {
    return fallback;
  }
  return interpolateTemplate(template, { value, amount: value }, fallback);
};

const formatTemplateWithPair = (template, amount, equivalent) => {
  const fallback = normalizeDisplayValue(amount, FALLBACK_VALUE);
  if (!template) {
    return fallback;
  }
  return interpolateTemplate(
    template,
    { amount, value: amount, equivalent },
    fallback,
  );
};

/**
 * 意图：在不引入第三方依赖的前提下，将订阅到期日期规范化为稳定可读的格式。
 * 输入：
 *  - value: 可能为字符串或 Date 实例的日期输入；
 * 输出：
 *  - 适合展示的字符串，若无法解析则返回 null。该字符串优先使用本地化格式，退化为 ISO-8601。
 * 流程：
 *  1) 解析形如 YYYY-MM-DD 的字符串并提取年月日；
 *  2) 利用 UTC 正午构建 Date，规避因时区偏移导致的跨日；
 *  3) 使用 Intl.DateTimeFormat 输出本地化日期文本，失败时回退为 ISO 字符串；
 *  4) 对于无法识别的输入直接退化为字符串本身。
 * 错误处理：
 *  - 捕获所有异常并返回 null，确保到期信息缺失时不会破坏界面。
 * 复杂度：O(1)。
 */
const formatRenewalDate = (value) => {
  if (!value) {
    return null;
  }

  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    try {
      return new Intl.DateTimeFormat(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      }).format(value);
    } catch {
      return value.toISOString().slice(0, 10);
    }
  }

  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  const isoMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})(?:[T\s].*)?$/);
  if (!isoMatch) {
    return trimmed;
  }

  const [, yearString, monthString, dayString] = isoMatch;
  const year = Number(yearString);
  const month = Number(monthString);
  const day = Number(dayString);

  if (
    !Number.isFinite(year) ||
    !Number.isFinite(month) ||
    !Number.isFinite(day) ||
    month < 1 ||
    month > 12 ||
    day < 1 ||
    day > 31
  ) {
    return `${yearString}-${monthString}-${dayString}`;
  }

  const normalizedIso = `${yearString}-${monthString}-${dayString}`;

  try {
    const safeDate = new Date(Date.UTC(year, month - 1, day, 12));
    const formatted = new Intl.DateTimeFormat(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(safeDate);
    const normalized = normalizeDisplayValue(formatted, normalizedIso);
    return normalized;
  } catch {
    return normalizedIso;
  }
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

const translateByMap = (
  translations,
  mapping,
  key,
  fallback = FALLBACK_VALUE,
) => {
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

const KNOWN_PLAN_IDS = new Set(PLAN_SEQUENCE);

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
 *  3) 返回首个命中已知套餐序列的值，否则回退到 FREE。
 * 错误处理：
 *  - 对于非字符串或未知取值，自动忽略并继续尝试下一候选。
 */
const resolveCurrentPlanId = (userProfile, { fallbackPlan = "FREE" } = {}) => {
  const membership = deriveMembershipSnapshot(userProfile);
  const subscriptionMeta = userProfile?.subscription ?? {};
  const candidates = [
    subscriptionMeta.planId,
    subscriptionMeta.currentPlanId,
    subscriptionMeta.plan,
    subscriptionMeta.tier,
    userProfile?.plan,
  ]
    .map((candidate) => {
      if (typeof candidate !== "string") {
        return null;
      }
      const trimmed = candidate.trim();
      if (!trimmed) {
        return null;
      }
      return trimmed.toUpperCase();
    })
    .filter(Boolean);

  if (membership.planId !== "FREE") {
    candidates.push(membership.planId);
  }

  for (const candidate of candidates) {
    if (KNOWN_PLAN_IDS.has(candidate)) {
      return candidate;
    }
  }

  return fallbackPlan;
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
  const unavailable = safeString(
    t.subscriptionValueUnavailable,
    FALLBACK_VALUE,
  );
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
      label: safeString(t.subscriptionFeatureWordLookupsDaily, "每日查词上限"),
      resolve: (plan) =>
        formatQuota(
          plan.quotas?.wordLookupsDaily,
          t.subscriptionUnitTimesPerDay,
          {
            zeroLabel,
            softLimitNote:
              plan.id === "PREMIUM" && softLimitNote ? ` ${softLimitNote}` : "",
          },
        ),
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
      label: safeString(t.subscriptionFeatureNotebookCapacity, "生词本容量"),
      resolve: (plan) =>
        formatQuota(plan.quotas?.notebookCapacity, t.subscriptionUnitItems, {
          zeroLabel,
        }),
    },
    {
      id: "alignedLanguages",
      label: safeString(t.subscriptionFeatureAlignedLanguages, "多语对齐例句"),
      resolve: (plan) =>
        formatQuota(
          plan.quotas?.alignedLanguages,
          t.subscriptionUnitLanguages,
          {
            zeroLabel,
          },
        ),
    },
    {
      id: "ocrPagesMonthly",
      label: safeString(t.subscriptionFeatureOcrPages, "OCR / 图片取词"),
      resolve: (plan) =>
        formatQuota(
          plan.quotas?.ocrPagesMonthly,
          t.subscriptionUnitPagesPerMonth,
          {
            zeroLabel: unavailable,
          },
        ),
    },
    {
      id: "pdfPagesMonthly",
      label: safeString(t.subscriptionFeaturePdfPages, "PDF 取词"),
      resolve: (plan) =>
        formatQuota(
          plan.quotas?.pdfPagesMonthly,
          t.subscriptionUnitPagesPerMonth,
          {
            zeroLabel: unavailable,
          },
        ),
    },
    {
      id: "concurrentRequests",
      label: safeString(t.subscriptionFeatureConcurrentRequests, "并发请求数"),
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
        translateByMap(
          t,
          PRIORITY_KEY_MAP,
          plan.benefits?.priority,
          FALLBACK_VALUE,
        ),
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
      label: safeString(t.subscriptionFeatureHistoryRetention, "历史记录保留"),
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
  subscriptionMeta,
  membership,
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
  const freePrice = safeString(translations.subscriptionPlanFreePrice, "免费");
  const monthlyTemplate = safeString(
    translations.subscriptionPriceMonthly,
    "{amount}/月",
  );
  const yearlyTemplate = safeString(
    translations.subscriptionPriceYearly,
    "{amount}/年",
  );
  const yearlyWithEquivalentTemplate =
    translations.subscriptionPriceYearlyWithEquivalent;
  const nextRenewalTemplate = safeString(
    translations.subscriptionNextRenewalTemplate,
    "Next renewal: {value}",
  );

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

    let subscriptionExpiryLine = null;
    if (isCurrent && planId !== "FREE") {
      const renewalSource =
        subscriptionMeta?.nextRenewalDate ??
        (membership?.planId === planId ? membership.expiresAt : null);
      const formattedRenewalDate = formatRenewalDate(renewalSource);
      if (formattedRenewalDate) {
        subscriptionExpiryLine = formatWithTemplate(
          nextRenewalTemplate,
          formattedRenewalDate,
        );
      }
    }

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
      subscriptionExpiryLine: subscriptionExpiryLine ?? undefined,
    };
  });
};

const buildFeatureMatrix = ({ blueprint, visiblePlanIds, pricing }) =>
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
}) {
  const t = translations ?? {};
  const userProfile = user ?? {};
  const membership = deriveMembershipSnapshot(userProfile);
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
    membership,
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
