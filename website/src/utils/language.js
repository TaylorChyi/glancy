export const WORD_LANGUAGE_AUTO = "AUTO";
const SUPPORTED_WORD_LANGUAGES = Object.freeze([
  WORD_LANGUAGE_AUTO,
  "CHINESE",
  "ENGLISH",
]);

const CHINESE_CHAR_PATTERN = /[\u4e00-\u9fff]/u;

/**
 * Detect the language of a text based on presence of Chinese characters.
 * @param {string} text
 * @returns {'CHINESE' | 'ENGLISH'}
 */
export function detectWordLanguage(text = "") {
  return CHINESE_CHAR_PATTERN.test(text) ? "CHINESE" : "ENGLISH";
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

/**
 * Resolve the effective lookup language by combining user preference and heuristics.
 * @param {string} text
 * @param {'AUTO' | 'CHINESE' | 'ENGLISH'} preference
 * @returns {'CHINESE' | 'ENGLISH'}
 */
export function resolveWordLanguage(
  text = "",
  preference = WORD_LANGUAGE_AUTO,
) {
  const normalized = normalizeWordLanguage(preference);
  if (normalized !== WORD_LANGUAGE_AUTO) {
    return normalized;
  }
  return detectWordLanguage(text);
}

export function getSupportedWordLanguages() {
  return SUPPORTED_WORD_LANGUAGES.slice();
}
