import translations from "./index.js";

const SUPPORTED_LANGUAGE_CODES = Object.freeze(Object.keys(translations));

export const SYSTEM_LANGUAGE_AUTO = "auto";

export function getSupportedLanguageCodes() {
  return SUPPORTED_LANGUAGE_CODES;
}

export function isSupportedLanguage(value) {
  return SUPPORTED_LANGUAGE_CODES.includes(value);
}
