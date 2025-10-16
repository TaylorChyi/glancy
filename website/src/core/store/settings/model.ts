/**
 * 背景：
 *  - 原有设置 Store 将常量、类型、默认值和副作用耦合在一个文件中，扩展语言或模式配置时易出现冲突。
 * 目的：
 *  - 抽离设置领域的基础模型定义，确保常量与类型集中管理，降低业务逻辑与存储实现的耦合。
 * 关键决策与取舍：
 *  - 采用“领域模型文件 + 策略归一”结构，将纯数据定义沉淀到本模块，其余逻辑通过策略模块组合。
 *  - 放弃继续在单文件内堆叠常量，避免多处定义导致的命名覆盖冲突。
 * 影响范围：
 *  - 依赖设置 Store 的模块需从本文件获取共享常量与类型。
 *  - 语言、Markdown、聊天模式等新增配置需在此更新默认值与枚举。
 * 演进与TODO：
 *  - 如后续引入多终端配置差异，可在此增加平台枚举并在策略模块扩展对应处理。
 */

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

export const CHAT_COMPLETION_MODE_STREAMING = "stream" as const;
export const CHAT_COMPLETION_MODE_SYNC = "sync" as const;

export const MARKDOWN_RENDERING_MODES = Object.freeze([
  MARKDOWN_RENDERING_MODE_DYNAMIC,
  MARKDOWN_RENDERING_MODE_PLAIN,
] as const satisfies ReadonlyArray<string>);

export const CHAT_COMPLETION_MODES = Object.freeze([
  CHAT_COMPLETION_MODE_STREAMING,
  CHAT_COMPLETION_MODE_SYNC,
] as const satisfies ReadonlyArray<string>);

export type MarkdownRenderingMode = (typeof MARKDOWN_RENDERING_MODES)[number];
export type ChatCompletionMode = (typeof CHAT_COMPLETION_MODES)[number];

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
  chatCompletionMode: ChatCompletionMode;
};

export type SettingsActions = {
  setSystemLanguage: (language: SystemLanguage) => void;
  setDictionarySourceLanguage: (language: DictionarySourceLanguage) => void;
  setDictionaryTargetLanguage: (language: DictionaryTargetLanguage) => void;
  setMarkdownRenderingMode: (mode: MarkdownRenderingMode) => void;
  setChatCompletionMode: (mode: ChatCompletionMode) => void;
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
  chatCompletionMode: CHAT_COMPLETION_MODE_STREAMING,
};

export const SUPPORTED_SYSTEM_LANGUAGES = getSupportedLanguageCodes();

export {
  WORD_LANGUAGE_AUTO,
  WORD_LANGUAGE_ENGLISH_MONO,
  WORD_DEFAULT_TARGET_LANGUAGE,
};
