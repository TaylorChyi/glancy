/**
 * 背景：
 *  - 举报弹窗的文案与语言推断逻辑逐渐膨胀，分散在组件内部难以维护。
 * 目的：
 *  - 抽离可测试的纯函数，生成举报视图所需的语言上下文与摘要数据。
 * 关键决策与取舍：
 *  - 采用 ViewModel 辅助方法，将 UI 组合与领域推断分离，便于未来接入多语言策略；
 *  - 保留纯函数形态，支持单元测试覆盖口味、语言等边界分支。
 * 影响范围：
 *  - 举报弹窗的语言标签、类别选项与摘要展示。
 * 演进与TODO：
 *  - 后续可接入服务端配置的语言矩阵，替换当前写死的单向映射。
 */

const DEFAULT_LANGUAGE_LABELS = {
  ENGLISH: "English",
  CHINESE: "Chinese",
  AUTO: "Auto",
};

const FLAVOR_SOURCE_FALLBACKS = {
  MONOLINGUAL_CHINESE: "CHINESE",
};

const FLAVOR_TARGET_FALLBACKS = {
  MONOLINGUAL_ENGLISH: "ENGLISH",
  MONOLINGUAL_CHINESE: "CHINESE",
};

const ENGLISH_KEY = "ENGLISH";
const CHINESE_KEY = "CHINESE";
const AUTO_KEY = "AUTO";

const normalizeLanguageKey = (value) =>
  typeof value === "string" ? value.toUpperCase() : "";

const createDictionaryModeLabel = (
  languageLabels,
  resolvedSourceKey,
  resolvedTargetKey,
) => {
  const sourceLabel =
    languageLabels[resolvedSourceKey] ?? resolvedSourceKey ?? "";
  const targetLabel =
    languageLabels[resolvedTargetKey] ?? resolvedTargetKey ?? "";

  if (!targetLabel) {
    return sourceLabel;
  }

  return `${sourceLabel} → ${targetLabel}`;
};

export const createLanguageLabels = (translations) => ({
  ENGLISH:
    translations.reportLanguageValueEnglish ?? DEFAULT_LANGUAGE_LABELS.ENGLISH,
  CHINESE:
    translations.reportLanguageValueChinese ?? DEFAULT_LANGUAGE_LABELS.CHINESE,
  AUTO:
    translations.dictionarySourceLanguageAuto ?? DEFAULT_LANGUAGE_LABELS.AUTO,
});

export const resolveLanguageContext = ({
  language,
  flavor,
  sourceLanguage,
  targetLanguage,
  languageLabels,
}) => {
  const languageKey = normalizeLanguageKey(language);
  const flavorKey = normalizeLanguageKey(flavor);
  const sourcePreferenceKey = normalizeLanguageKey(sourceLanguage);
  const targetPreferenceKey = normalizeLanguageKey(targetLanguage);

  const resolvedSourceKey = (() => {
    if (sourcePreferenceKey && sourcePreferenceKey !== AUTO_KEY) {
      return sourcePreferenceKey;
    }
    if (languageKey) {
      return languageKey;
    }
    if (flavorKey in FLAVOR_SOURCE_FALLBACKS) {
      return FLAVOR_SOURCE_FALLBACKS[flavorKey];
    }
    return ENGLISH_KEY;
  })();

  const resolvedTargetKey = (() => {
    if (targetPreferenceKey) {
      return targetPreferenceKey;
    }
    if (flavorKey in FLAVOR_TARGET_FALLBACKS) {
      return FLAVOR_TARGET_FALLBACKS[flavorKey];
    }
    if (resolvedSourceKey === ENGLISH_KEY) {
      return CHINESE_KEY;
    }
    return ENGLISH_KEY;
  })();

  const resolvedLanguageLabel = languageLabels[languageKey] ?? language ?? "";

  return {
    resolvedSourceKey,
    resolvedTargetKey,
    resolvedLanguageLabel,
    dictionaryModeLabel: createDictionaryModeLabel(
      languageLabels,
      resolvedSourceKey,
      resolvedTargetKey,
    ),
  };
};

export const buildSummaryItems = ({
  term,
  language,
  resolvedLanguageLabel,
  dictionaryModeLabel,
  translations,
}) => {
  const summaryItems = [
    {
      key: "term",
      label: translations.reportTermLabel ?? "Term",
      value: term,
    },
  ];

  if (language) {
    summaryItems.push({
      key: "language",
      label: translations.reportLanguageLabel ?? "Language",
      value: resolvedLanguageLabel,
    });
  }

  if (dictionaryModeLabel) {
    summaryItems.push({
      key: "dictionary-mode",
      label: translations.reportFlavorLabel ?? "Dictionary",
      value: dictionaryModeLabel,
    });
  }

  return summaryItems;
};

export const createCategoryOptions = (categories, translations) =>
  categories.map((option) => ({
    id: option.value,
    value: option.value,
    label: translations[option.labelKey] ?? option.value,
  }));

const pickTranslation = (translations, keys, fallback) => {
  for (const key of keys) {
    const value = translations[key];
    if (value !== null && value !== undefined) {
      return value;
    }
  }
  return fallback;
};

export const buildModalStrings = (translations, error) => ({
  title: pickTranslation(translations, ["reportTitle"], "Report an issue"),
  categoryLabel: pickTranslation(
    translations,
    ["reportCategoryLabel"],
    "Issue type",
  ),
  descriptionLabel: pickTranslation(
    translations,
    ["reportDescriptionLabel"],
    "Details",
  ),
  descriptionPlaceholder: pickTranslation(
    translations,
    ["reportDescriptionPlaceholder"],
    "Tell us more (optional)",
  ),
  cancelLabel: pickTranslation(
    translations,
    ["reportCancel", "cancel"],
    "Cancel",
  ),
  submitLabel: pickTranslation(translations, ["reportSubmit"], "Submit"),
  submittingLabel: pickTranslation(
    translations,
    ["reportSubmitting", "loading"],
    "Submitting",
  ),
  closeLabel: pickTranslation(translations, ["close"], "Close"),
  errorMessage: error
    ? pickTranslation(translations, ["reportErrorMessage"], error)
    : "",
});

export const __INTERNALS__ = {
  createDictionaryModeLabel,
  normalizeLanguageKey,
  DEFAULT_LANGUAGE_LABELS,
  pickTranslation,
};
