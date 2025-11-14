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

export const normalizeLanguageKey = (value) =>
  typeof value === "string" ? value.toUpperCase() : "";

export const createDictionaryModeLabel = (
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

const resolveSourceLanguageKey = ({
  languageKey,
  flavorKey,
  sourcePreferenceKey,
}) => {
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
};

const resolveTargetLanguageKey = ({
  flavorKey,
  targetPreferenceKey,
  resolvedSourceKey,
}) => {
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
};

const getNormalizedLanguageKeys = ({ language, flavor, sourceLanguage, targetLanguage }) => ({
  languageKey: normalizeLanguageKey(language),
  flavorKey: normalizeLanguageKey(flavor),
  sourcePreferenceKey: normalizeLanguageKey(sourceLanguage),
  targetPreferenceKey: normalizeLanguageKey(targetLanguage),
});

const resolveDictionaryKeys = ({
  languageKey,
  flavorKey,
  sourcePreferenceKey,
  targetPreferenceKey,
}) => {
  const resolvedSourceKey = resolveSourceLanguageKey({
    languageKey,
    flavorKey,
    sourcePreferenceKey,
  });
  return {
    resolvedSourceKey,
    resolvedTargetKey: resolveTargetLanguageKey({
      flavorKey,
      targetPreferenceKey,
      resolvedSourceKey,
    }),
  };
};

const buildResolvedLanguageContext = ({
  languageKey,
  language,
  languageLabels,
  resolvedSourceKey,
  resolvedTargetKey,
}) => ({
  resolvedSourceKey,
  resolvedTargetKey,
  resolvedLanguageLabel: languageLabels[languageKey] ?? language ?? "",
  dictionaryModeLabel: createDictionaryModeLabel(
    languageLabels,
    resolvedSourceKey,
    resolvedTargetKey,
  ),
});

export const resolveLanguageContext = (args) => {
  const keys = getNormalizedLanguageKeys(args);
  const resolvedKeys = resolveDictionaryKeys(keys);
  return buildResolvedLanguageContext({
    languageKey: keys.languageKey,
    language: args.language,
    languageLabels: args.languageLabels,
    ...resolvedKeys,
  });
};

export const __INTERNALS__ = {
  createDictionaryModeLabel,
  normalizeLanguageKey,
  DEFAULT_LANGUAGE_LABELS,
};

export const __TESTING__ = {
  FLAVOR_SOURCE_FALLBACKS,
  FLAVOR_TARGET_FALLBACKS,
  ENGLISH_KEY,
  CHINESE_KEY,
  AUTO_KEY,
};
