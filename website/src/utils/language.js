export const WORD_LANGUAGE_AUTO = "AUTO";
export const WORD_LANGUAGE_ENGLISH_MONO = "ENGLISH_MONOLINGUAL";
export const WORD_FLAVOR_BILINGUAL = "BILINGUAL";
export const WORD_FLAVOR_MONOLINGUAL_ENGLISH = "MONOLINGUAL_ENGLISH";

const LANGUAGE_BADGES = Object.freeze({
  AUTO: "AUTO",
  CHINESE: "ZH",
  ENGLISH: "EN",
});

const SUPPORTED_WORD_LANGUAGES = Object.freeze([
  WORD_LANGUAGE_AUTO,
  "CHINESE",
  "ENGLISH",
  WORD_LANGUAGE_ENGLISH_MONO,
]);

const SUPPORTED_SOURCE_LANGUAGES = Object.freeze([
  WORD_LANGUAGE_AUTO,
  "CHINESE",
  "ENGLISH",
]);

const SUPPORTED_TARGET_LANGUAGES = Object.freeze(["CHINESE", "ENGLISH"]);

const DEFAULT_TARGET_LANGUAGE = "CHINESE";

export const WORD_TARGET_LANGUAGES = SUPPORTED_TARGET_LANGUAGES;
export const WORD_DEFAULT_TARGET_LANGUAGE = DEFAULT_TARGET_LANGUAGE;

const HAN_SCRIPT_PATTERN = /\p{Script=Han}/u;
const EXTENDED_CHINESE_MARKS_PATTERN = /[\u3007\u3021-\u3029]/u;

/**
 * Detect the language of a text based on presence of Chinese characters.
 * @param {string} text
 * @returns {'CHINESE' | 'ENGLISH'}
 */
export function detectWordLanguage(text = "") {
  if (typeof text !== "string" || text.trim().length === 0) {
    return "ENGLISH";
  }
  if (
    HAN_SCRIPT_PATTERN.test(text) ||
    EXTENDED_CHINESE_MARKS_PATTERN.test(text)
  ) {
    return "CHINESE";
  }
  return "ENGLISH";
}

/**
 * Determine whether the provided language code is recognised by the dictionary.
 * @param {string | null | undefined} value
 * @returns {boolean}
 */
export function isWordLanguage(value) {
  return (
    value != null &&
    SUPPORTED_WORD_LANGUAGES.includes(String(value).toUpperCase())
  );
}

/**
 * Normalise a raw language value to the canonical dictionary language token.
 * @param {string | null | undefined} value
 * @returns {'AUTO' | 'CHINESE' | 'ENGLISH'}
 */
export function normalizeWordLanguage(value) {
  if (!value) return WORD_LANGUAGE_AUTO;
  const upper = String(value).toUpperCase();
  return isWordLanguage(upper) ? upper : WORD_LANGUAGE_AUTO;
}

export function normalizeWordSourceLanguage(value) {
  const normalized = normalizeWordLanguage(value);
  if (normalized === WORD_LANGUAGE_ENGLISH_MONO) {
    return "ENGLISH";
  }
  return SUPPORTED_SOURCE_LANGUAGES.includes(normalized)
    ? normalized
    : WORD_LANGUAGE_AUTO;
}

export function normalizeWordTargetLanguage(value) {
  if (!value) return DEFAULT_TARGET_LANGUAGE;
  const upper = String(value).toUpperCase();
  return SUPPORTED_TARGET_LANGUAGES.includes(upper)
    ? upper
    : DEFAULT_TARGET_LANGUAGE;
}

export function resolveLanguageBadge(value) {
  if (value == null) {
    return LANGUAGE_BADGES.AUTO;
  }

  const upper = String(value).toUpperCase();

  if (upper === WORD_LANGUAGE_ENGLISH_MONO) {
    return LANGUAGE_BADGES.ENGLISH;
  }

  return LANGUAGE_BADGES[upper] ?? upper;
}

/**
 * Resolve the effective lookup language by combining user preference and heuristics.
 * @param {string} text
 * @param {'AUTO' | 'CHINESE' | 'ENGLISH'} preference
 * @returns {'CHINESE' | 'ENGLISH'}
 */
export function resolveWordSourceLanguage(
  text = "",
  preference = WORD_LANGUAGE_AUTO,
) {
  const normalized = normalizeWordSourceLanguage(preference);
  if (normalized === WORD_LANGUAGE_AUTO) {
    return detectWordLanguage(text);
  }
  return normalized;
}

export function resolveDictionaryFlavor({
  sourceLanguage,
  targetLanguage,
  resolvedSourceLanguage,
} = {}) {
  const normalizedTarget = normalizeWordTargetLanguage(targetLanguage);
  const normalizedSourcePreference =
    normalizeWordSourceLanguage(sourceLanguage);
  const normalizedSource = resolvedSourceLanguage
    ? String(resolvedSourceLanguage).toUpperCase() === "ENGLISH"
      ? "ENGLISH"
      : "CHINESE"
    : normalizedSourcePreference === WORD_LANGUAGE_AUTO
      ? "CHINESE"
      : normalizedSourcePreference;

  if (normalizedSource === "ENGLISH" && normalizedTarget === "ENGLISH") {
    return WORD_FLAVOR_MONOLINGUAL_ENGLISH;
  }
  return WORD_FLAVOR_BILINGUAL;
}

export function resolveDictionaryConfig(
  text = "",
  {
    sourceLanguage = WORD_LANGUAGE_AUTO,
    targetLanguage = DEFAULT_TARGET_LANGUAGE,
  } = {},
) {
  const language = resolveWordSourceLanguage(text, sourceLanguage);
  const flavor = resolveDictionaryFlavor({
    sourceLanguage,
    targetLanguage,
    resolvedSourceLanguage: language,
  });
  return { language, flavor };
}

export function resolveWordLanguage(
  text = "",
  preference = WORD_LANGUAGE_AUTO,
) {
  return resolveWordSourceLanguage(text, preference);
}

export function resolveWordFlavor(
  preference = WORD_LANGUAGE_AUTO,
  targetLanguage = DEFAULT_TARGET_LANGUAGE,
) {
  return resolveDictionaryFlavor({
    sourceLanguage: preference,
    targetLanguage,
  });
}

export function getSupportedWordLanguages() {
  return SUPPORTED_WORD_LANGUAGES.slice();
}
