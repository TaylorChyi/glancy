/**
 * 背景：
 *  - 设置 Store 中的校验逻辑散落各处，新增配置时容易复制粘贴，导致行为不一致。
 * 目的：
 *  - 通过策略模式集中定义各项偏好的规范化算法，形成可组合的业务规则中心。
 * 关键决策与取舍：
 *  - 采用 createOptionNormalizer 生成器包装有限集合校验，将“集合校验”与“值处理”解耦。
 *  - 系统语言依旧依赖 i18n 模块判定支持范围，避免重复维护语言清单。
 * 影响范围：
 *  - 设置 Store 及未来复用此模块的特性都将获得一致的参数归一能力。
 * 演进与TODO：
 *  - 若后续需要按终端区分策略，可扩展 createOptionNormalizer 接收上下文参数。
 */

import { isSupportedLanguage } from "@core/i18n/languages.js";
import {
  DEFAULT_LANGUAGE_FALLBACK,
  DictionaryLegacyLanguage,
  DictionarySourceLanguage,
  DictionaryTargetLanguage,
  MARKDOWN_RENDERING_MODE_DYNAMIC,
  MARKDOWN_RENDERING_MODES,
  SYSTEM_LANGUAGE_AUTO,
  type MarkdownRenderingMode,
  type SystemLanguage,
  WORD_DEFAULT_TARGET_LANGUAGE,
  WORD_LANGUAGE_AUTO,
  WORD_LANGUAGE_ENGLISH_MONO,
} from "./model.js";
import {
  normalizeWordLanguage,
  normalizeWordSourceLanguage,
  normalizeWordTargetLanguage,
} from "@shared/utils/language.js";

export type DictionaryPreference = {
  dictionarySourceLanguage: DictionarySourceLanguage;
  dictionaryTargetLanguage: DictionaryTargetLanguage;
};

type Normalizer<T> = (candidate: unknown) => T;

type Projector<T extends string> = (value: string) => T;

const identityProjector: Projector<string> = (value) => value;

/**
 * 意图：基于策略模式生成有限集合的归一化函数。
 * 输入：待校验集合、默认值以及自定义格式化方法。
 * 输出：用于归一化输入的纯函数。
 * 流程：
 *  1) 将集合构建为 Set 以提供 O(1) 的包含判断。
 *  2) 若输入可转换为字符串，则交由 projector 统一格式。
 *  3) 判断是否属于集合，若是则返回；否则回退默认值。
 * 错误处理：捕获非法输入后统一回退默认值，不抛异常。
 * 复杂度：O(1)。
 */
function createOptionNormalizer<T extends string>(
  options: readonly T[],
  fallback: T,
  projector: Projector<T> = identityProjector as Projector<T>,
): Normalizer<T> {
  const optionSet = new Set(options);
  return (candidate: unknown) => {
    if (typeof candidate === "string") {
      const normalized = projector(candidate);
      if (optionSet.has(normalized)) {
        return normalized;
      }
    }
    return fallback;
  };
}

const markdownModeStrategy = createOptionNormalizer<MarkdownRenderingMode>(
  MARKDOWN_RENDERING_MODES,
  MARKDOWN_RENDERING_MODE_DYNAMIC,
  (value) => value.toLowerCase() as MarkdownRenderingMode,
);

export const normalizeMarkdownRenderingMode: Normalizer<MarkdownRenderingMode> =
  markdownModeStrategy;

export const sanitizeSystemLanguage: Normalizer<SystemLanguage> = (
  candidate,
) => {
  if (candidate === SYSTEM_LANGUAGE_AUTO) {
    return SYSTEM_LANGUAGE_AUTO;
  }
  if (typeof candidate === "string" && isSupportedLanguage(candidate)) {
    return candidate;
  }
  return DEFAULT_LANGUAGE_FALLBACK;
};

export const normalizeDictionarySourceLanguage: Normalizer<
  DictionarySourceLanguage
> = (candidate) =>
  normalizeWordSourceLanguage(candidate as string) as DictionarySourceLanguage;

export const normalizeDictionaryTargetLanguage: Normalizer<
  DictionaryTargetLanguage
> = (candidate) =>
  normalizeWordTargetLanguage(candidate as string) as DictionaryTargetLanguage;

export function normalizeLegacyDictionaryLanguage(
  candidate: unknown,
): DictionaryLegacyLanguage | undefined {
  if (typeof candidate !== "string") {
    return undefined;
  }
  return normalizeWordLanguage(candidate) as DictionaryLegacyLanguage;
}

function resolveFromLegacyLanguage(
  language: DictionaryLegacyLanguage | undefined,
): DictionaryPreference {
  switch (language) {
    case "CHINESE":
      return {
        dictionarySourceLanguage: "CHINESE",
        dictionaryTargetLanguage: "ENGLISH",
      };
    case "ENGLISH":
      return {
        dictionarySourceLanguage: "ENGLISH",
        dictionaryTargetLanguage: WORD_DEFAULT_TARGET_LANGUAGE,
      };
    case WORD_LANGUAGE_ENGLISH_MONO:
      return {
        dictionarySourceLanguage: "ENGLISH",
        dictionaryTargetLanguage: "ENGLISH",
      };
    case WORD_LANGUAGE_AUTO:
    default:
      return {
        dictionarySourceLanguage: WORD_LANGUAGE_AUTO,
        dictionaryTargetLanguage: WORD_DEFAULT_TARGET_LANGUAGE,
      };
  }
}

export function resolveDictionaryPreference(options: {
  legacyLanguage?: DictionaryLegacyLanguage;
  persistedSource?: unknown;
  persistedTarget?: unknown;
  hasPersistedSource: boolean;
  hasPersistedTarget: boolean;
}): DictionaryPreference {
  if (
    options.legacyLanguage &&
    !options.hasPersistedSource &&
    !options.hasPersistedTarget
  ) {
    return resolveFromLegacyLanguage(options.legacyLanguage);
  }
  return {
    dictionarySourceLanguage: normalizeDictionarySourceLanguage(
      options.persistedSource,
    ),
    dictionaryTargetLanguage: normalizeDictionaryTargetLanguage(
      options.persistedTarget,
    ),
  };
}

export function resolveDictionaryPreferenceFromLegacy(
  language: DictionaryLegacyLanguage | undefined,
): DictionaryPreference {
  return resolveFromLegacyLanguage(language);
}
