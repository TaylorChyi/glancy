export const WORD_LANGUAGE_AUTO = "AUTO";
export const WORD_LANGUAGE_ENGLISH_MONO = "ENGLISH_MONOLINGUAL";
export const WORD_FLAVOR_BILINGUAL = "BILINGUAL";
export const WORD_FLAVOR_MONOLINGUAL_ENGLISH = "MONOLINGUAL_ENGLISH";
const SUPPORTED_WORD_LANGUAGES = Object.freeze([
  WORD_LANGUAGE_AUTO,
  "CHINESE",
  "ENGLISH",
  WORD_LANGUAGE_ENGLISH_MONO,
]);

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
    if (normalized === WORD_LANGUAGE_ENGLISH_MONO) {
      return "ENGLISH";
    }
    return normalized;
  }
  return detectWordLanguage(text);
}

export function resolveWordFlavor(preference = WORD_LANGUAGE_AUTO) {
  const normalized = normalizeWordLanguage(preference);
  return normalized === WORD_LANGUAGE_ENGLISH_MONO
    ? WORD_FLAVOR_MONOLINGUAL_ENGLISH
    : WORD_FLAVOR_BILINGUAL;
}

export function getSupportedWordLanguages() {
  return SUPPORTED_WORD_LANGUAGES.slice();
}
