import {
  SYSTEM_LANGUAGE_AUTO as SYSTEM_LANGUAGE_AUTO_SYMBOL,
  getSupportedLanguageCodes,
} from "@core/i18n/languages.js";
import {
  WORD_LANGUAGE_AUTO,
  WORD_LANGUAGE_ENGLISH_MONO,
  WORD_DEFAULT_TARGET_LANGUAGE,
} from "@shared/utils/language.js";

export const LEGACY_LANGUAGE_STORAGE_KEY = "lang";
export const SETTINGS_STORAGE_KEY = "settings";
export const DEFAULT_LANGUAGE_FALLBACK = "zh";

export const SYSTEM_LANGUAGE_AUTO = SYSTEM_LANGUAGE_AUTO_SYMBOL;

export type SystemLanguage = typeof SYSTEM_LANGUAGE_AUTO | string;

export type DictionarySourceLanguage =
  | typeof WORD_LANGUAGE_AUTO
  | "CHINESE"
  | "ENGLISH";

export type DictionaryTargetLanguage = "CHINESE" | "ENGLISH";

export const MARKDOWN_RENDERING_MODE_DYNAMIC = "dynamic" as const;
export const MARKDOWN_RENDERING_MODE_PLAIN = "plain" as const;

export const MARKDOWN_RENDERING_MODES = Object.freeze([
  MARKDOWN_RENDERING_MODE_DYNAMIC,
  MARKDOWN_RENDERING_MODE_PLAIN,
] as const satisfies ReadonlyArray<string>);

export type MarkdownRenderingMode = (typeof MARKDOWN_RENDERING_MODES)[number];

export type DictionaryLegacyLanguage =
  | typeof WORD_LANGUAGE_AUTO
  | "CHINESE"
  | "ENGLISH"
  | typeof WORD_LANGUAGE_ENGLISH_MONO;

export type SettingsSlice = {
  systemLanguage: SystemLanguage;
  dictionarySourceLanguage: DictionarySourceLanguage;
  dictionaryTargetLanguage: DictionaryTargetLanguage;
  markdownRenderingMode: MarkdownRenderingMode;
};

export type SettingsActions = {
  setSystemLanguage: (language: SystemLanguage) => void;
  setDictionarySourceLanguage: (language: DictionarySourceLanguage) => void;
  setDictionaryTargetLanguage: (language: DictionaryTargetLanguage) => void;
  setMarkdownRenderingMode: (mode: MarkdownRenderingMode) => void;
  /**
   * @deprecated 请改用 setDictionarySourceLanguage / setDictionaryTargetLanguage
   */
  setDictionaryLanguage: (language: DictionaryLegacyLanguage) => void;
};

export type SettingsState = SettingsSlice & SettingsActions;

export const DEFAULT_SETTINGS_SLICE: SettingsSlice = {
  systemLanguage: SYSTEM_LANGUAGE_AUTO,
  dictionarySourceLanguage: WORD_LANGUAGE_AUTO,
  dictionaryTargetLanguage: WORD_DEFAULT_TARGET_LANGUAGE,
  markdownRenderingMode: MARKDOWN_RENDERING_MODE_DYNAMIC,
};

export const SUPPORTED_SYSTEM_LANGUAGES = getSupportedLanguageCodes();

export {
  WORD_LANGUAGE_AUTO,
  WORD_LANGUAGE_ENGLISH_MONO,
  WORD_DEFAULT_TARGET_LANGUAGE,
};
