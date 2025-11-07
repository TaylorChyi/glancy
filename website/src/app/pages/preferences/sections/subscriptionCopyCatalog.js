import {
  FALLBACK_VALUE,
  formatQuota,
  formatWithTemplate,
  safeString,
} from "./subscriptionFormattingToolkit.js";

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

const QUOTA_FEATURE_DEFINITIONS = [
  {
    id: "wordLookupsDaily",
    labelKey: "subscriptionFeatureWordLookupsDaily",
    fallbackLabel: "每日查词上限",
    path: ["quotas", "wordLookupsDaily"],
    unitKey: "subscriptionUnitTimesPerDay",
    appendPremiumSoftLimit: true,
  },
  {
    id: "llmCallsDaily",
    labelKey: "subscriptionFeatureAiCallsDaily",
    fallbackLabel: "AI 调用",
    path: ["quotas", "llmCallsDaily"],
    unitKey: "subscriptionUnitTimesPerDay",
    appendPremiumSoftLimit: true,
  },
  {
    id: "ttsDaily",
    labelKey: "subscriptionFeatureTtsDaily",
    fallbackLabel: "TTS 发音",
    path: ["quotas", "ttsDaily"],
    unitKey: "subscriptionUnitTimesPerDay",
    appendPremiumSoftLimit: true,
  },
  {
    id: "notebookCapacity",
    labelKey: "subscriptionFeatureNotebookCapacity",
    fallbackLabel: "生词本容量",
    path: ["quotas", "notebookCapacity"],
    unitKey: "subscriptionUnitItems",
  },
  {
    id: "alignedLanguages",
    labelKey: "subscriptionFeatureAlignedLanguages",
    fallbackLabel: "多语对齐例句",
    path: ["quotas", "alignedLanguages"],
    unitKey: "subscriptionUnitLanguages",
  },
  {
    id: "ocrPagesMonthly",
    labelKey: "subscriptionFeatureOcrPages",
    fallbackLabel: "OCR / 图片取词",
    path: ["quotas", "ocrPagesMonthly"],
    unitKey: "subscriptionUnitPagesPerMonth",
    zeroLabelOverride: (context) => context.unavailable,
  },
  {
    id: "pdfPagesMonthly",
    labelKey: "subscriptionFeaturePdfPages",
    fallbackLabel: "PDF 取词",
    path: ["quotas", "pdfPagesMonthly"],
    unitKey: "subscriptionUnitPagesPerMonth",
    zeroLabelOverride: (context) => context.unavailable,
  },
];

const MAP_FEATURE_DEFINITIONS = [
  {
    id: "concurrentRequests",
    labelKey: "subscriptionFeatureConcurrentRequests",
    fallbackLabel: "并发请求数",
    path: ["benefits", "concurrentRequests"],
    map: BOOL_VALUE_MAP,
  },
  {
    id: "priority",
    labelKey: "subscriptionFeaturePriority",
    fallbackLabel: "客服优先级",
    path: ["benefits", "priority"],
    map: PRIORITY_KEY_MAP,
  },
  {
    id: "bulkExport",
    labelKey: "subscriptionFeatureBulkExport",
    fallbackLabel: "批量导入/导出",
    path: ["benefits", "bulkExport"],
    map: BULK_EXPORT_KEY_MAP,
  },
  {
    id: "betaAccess",
    labelKey: "subscriptionFeatureBetaAccess",
    fallbackLabel: "Beta 内测通道",
    path: ["benefits", "betaAccess"],
    map: BETA_ACCESS_KEY_MAP,
  },
];

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

const createFeatureContext = (translations) => ({
  translations,
  softLimitNote: safeString(translations.subscriptionSoftLimitNote, ""),
  zeroLabel: safeString(translations.subscriptionValueNone, FALLBACK_VALUE),
  unavailable: safeString(
    translations.subscriptionValueUnavailable,
    FALLBACK_VALUE,
  ),
  historyTemplate: safeString(
    translations.subscriptionHistoryRetentionTemplate,
    "{value}",
  ),
  historyUnlimited: safeString(
    translations.subscriptionHistoryRetentionUnlimited,
    FALLBACK_VALUE,
  ),
  supportTemplate: safeString(
    translations.subscriptionSupportSloTemplate,
    "{value}",
  ),
});

const createLabel = (translations, key, fallback) =>
  safeString(translations[key], fallback);

const readNestedValue = (source, path) =>
  path.reduce((accumulator, segment) => accumulator?.[segment], source);

const appendSoftLimitNote = (planId, note) =>
  planId === "PREMIUM" && note ? ` ${note}` : "";

const createQuotaFeature = (definition, context) => ({
  id: definition.id,
  label: createLabel(
    context.translations,
    definition.labelKey,
    definition.fallbackLabel,
  ),
  resolve: (plan) => {
    const quotaValue = readNestedValue(plan, definition.path);
    const zeroLabel =
      definition.zeroLabelOverride?.(context) ?? context.zeroLabel;
    const softLimitNote = definition.appendPremiumSoftLimit
      ? appendSoftLimitNote(plan.id, context.softLimitNote)
      : "";
    return formatQuota(quotaValue, context.translations[definition.unitKey], {
      zeroLabel,
      softLimitNote,
    });
  },
});

const createMappedFeature = (definition, context) => ({
  id: definition.id,
  label: createLabel(
    context.translations,
    definition.labelKey,
    definition.fallbackLabel,
  ),
  resolve: (plan) =>
    translateByMap(
      context.translations,
      definition.map,
      readNestedValue(plan, definition.path),
      FALLBACK_VALUE,
    ),
});

const createHistoryRetentionFeature = (context) => ({
  id: "historyRetentionDays",
  label: createLabel(
    context.translations,
    "subscriptionFeatureHistoryRetention",
    "历史记录保留",
  ),
  resolve: (plan) => {
    const value = plan.benefits?.historyRetentionDays;
    if (typeof value !== "number") {
      return FALLBACK_VALUE;
    }
    if (value < 0) {
      return context.historyUnlimited;
    }
    if (value === 0) {
      return context.unavailable;
    }
    return formatWithTemplate(context.historyTemplate, value.toLocaleString());
  },
});

const createSupportSloFeature = (context) => ({
  id: "supportSloHours",
  label: createLabel(
    context.translations,
    "subscriptionFeatureSupportSlo",
    "客服响应 SLO",
  ),
  resolve: (plan) => {
    const hours = plan.benefits?.supportSloHours;
    if (typeof hours !== "number" || hours <= 0) {
      return FALLBACK_VALUE;
    }
    return formatWithTemplate(context.supportTemplate, hours.toLocaleString());
  },
});

/**
 * 意图：结合多语言资源构造套餐卡片的基础文案。
 */
export const buildPlanCopy = (t) => ({
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

/**
 * 意图：构造订阅能力矩阵蓝图，支持按套餐动态解析值。
 */
export const buildFeatureBlueprint = (t) => {
  const context = createFeatureContext(t);
  const quotaFeatures = QUOTA_FEATURE_DEFINITIONS.map((definition) =>
    createQuotaFeature(definition, context),
  );
  const mappedFeatures = MAP_FEATURE_DEFINITIONS.map((definition) =>
    createMappedFeature(definition, context),
  );

  return [
    ...quotaFeatures,
    ...mappedFeatures,
    createHistoryRetentionFeature(context),
    createSupportSloFeature(context),
  ];
};
