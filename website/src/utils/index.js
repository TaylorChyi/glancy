export { extractMessage, safeJSONParse } from "./json.js";
export { getModifierKey, useIsMobile } from "./device.js";
export { cacheBust } from "./url.js";
export { withStopPropagation } from "./stopPropagation.js";
export {
  detectWordLanguage,
  WORD_LANGUAGE_AUTO,
  WORD_LANGUAGE_ENGLISH_MONO,
  resolveWordLanguage,
  getSupportedWordLanguages,
  normalizeWordLanguage,
  isWordLanguage,
  resolveWordFlavor,
  WORD_FLAVOR_BILINGUAL,
  WORD_FLAVOR_MONOLINGUAL_ENGLISH,
  normalizeWordSourceLanguage,
  normalizeWordTargetLanguage,
  resolveDictionaryConfig,
  resolveDictionaryFlavor,
  WORD_TARGET_LANGUAGES,
  WORD_DEFAULT_TARGET_LANGUAGE,
  resolveLanguageBadge,
} from "./language.js";
export { getBrandText, BRAND_TEXT } from "./brand.js";
export { validateEmail, validatePhone, validateAccount } from "./validators.js";
export { audioManager } from "./audioManager.js";
export { decodeTtsAudio } from "./audio.js";
export { createCachedFetcher } from "./cache.js";
export { parseSse } from "./sse.js";
export { setCookie, deleteCookie, hasCookie, getCookie } from "./cookies.js";
export {
  extractMarkdownPreview,
  polishDictionaryMarkdown,
} from "./markdown.js";
export { resolveShareTarget, attemptShareLink } from "./share.js";
export { copyTextToClipboard } from "./clipboard.js";
