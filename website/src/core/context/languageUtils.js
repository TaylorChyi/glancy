import { isSupportedLanguage } from "@core/i18n/languages.js";

export const DEFAULT_LANGUAGE = "zh";

/**
 * 检测浏览器可用的语言代码（主语言段）。
 */
export function detectBrowserLanguage() {
  if (typeof navigator === "undefined") {
    return null;
  }

  const candidates =
    Array.isArray(navigator.languages) && navigator.languages.length > 0
      ? navigator.languages
      : [navigator.language];

  for (const raw of candidates) {
    if (typeof raw !== "string") continue;
    const trimmed = raw.trim();
    if (!trimmed) continue;
    const [primary] = trimmed.split(/[-_]/);
    const normalized = primary?.toLowerCase();
    if (normalized && isSupportedLanguage(normalized)) {
      return normalized;
    }
  }

  return null;
}

/**
 * 根据用户设置与浏览器首选项解析最终语言。
 */
export function resolveLanguage({
  systemLanguage,
  browserLanguage,
  fallback = DEFAULT_LANGUAGE,
}) {
  if (isSupportedLanguage(systemLanguage)) {
    return systemLanguage;
  }
  if (browserLanguage && isSupportedLanguage(browserLanguage)) {
    return browserLanguage;
  }
  return fallback;
}
