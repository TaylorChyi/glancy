/**
 * 背景：
 *  - 设置 Store 直接操纵 localStorage，缺乏集中化的容错与读取策略，易在重构时遗漏分支。
 * 目的：
 *  - 通过职责链抽象统一持久化读取顺序，隔离解析失败与回写逻辑。
 * 关键决策与取舍：
 *  - 采用“职责链 + 结构化解析”模式，保证新增来源时只需扩展 resolver 列表。
 *  - 解析异常统一捕获并输出结构化日志，避免打断正常流程。
 * 影响范围：
 *  - 设置 Store 初始化与 rehydrate 行为改由本模块提供的 API 驱动。
 * 演进与TODO：
 *  - 后续可在此接入跨端同步策略或特性开关以便灰度发布。
 */

import {
  LEGACY_LANGUAGE_STORAGE_KEY,
  SETTINGS_STORAGE_KEY,
  SYSTEM_LANGUAGE_AUTO,
  type SettingsSlice,
  type SystemLanguage,
} from "./model.js";
import { isSupportedLanguage } from "@core/i18n/languages.js";

export type PersistedSettingsSnapshot = {
  state?: Partial<
    SettingsSlice & {
      dictionaryLanguage?: string;
    }
  >;
} | null;

type LanguageResolver = () => SystemLanguage | null;

export function readPersistedSettingsSnapshot(
  storage: Storage,
): PersistedSettingsSnapshot {
  const raw = storage.getItem(SETTINGS_STORAGE_KEY);
  if (!raw) {
    return null;
  }
  try {
    return JSON.parse(raw) as PersistedSettingsSnapshot;
  } catch (error) {
    console.warn("[settings] failed to parse persisted state", error);
    return null;
  }
}

export function extractDictionaryPersistence(
  snapshot: PersistedSettingsSnapshot,
): {
  source: unknown;
  target: unknown;
  hasSource: boolean;
  hasTarget: boolean;
} {
  const state = snapshot?.state ?? {};
  const source = state.dictionarySourceLanguage;
  const target = state.dictionaryTargetLanguage;
  return {
    source,
    target,
    hasSource: Boolean(source),
    hasTarget: Boolean(target),
  };
}

export function persistLegacySystemLanguage(
  storage: Storage,
  language: SystemLanguage,
): void {
  if (language === SYSTEM_LANGUAGE_AUTO) {
    storage.removeItem(LEGACY_LANGUAGE_STORAGE_KEY);
    return;
  }
  if (isSupportedLanguage(language)) {
    storage.setItem(LEGACY_LANGUAGE_STORAGE_KEY, language);
  }
}

export function resolveInitialSystemLanguage(storage: Storage): SystemLanguage {
  const snapshot = readPersistedSettingsSnapshot(storage);
  const resolvers: LanguageResolver[] = [
    () => {
      const candidate = snapshot?.state?.systemLanguage;
      if (typeof candidate === "string" && isSupportedLanguage(candidate)) {
        return candidate;
      }
      return null;
    },
    () => {
      const legacy = storage.getItem(LEGACY_LANGUAGE_STORAGE_KEY);
      if (legacy && isSupportedLanguage(legacy)) {
        return legacy;
      }
      return null;
    },
    () => SYSTEM_LANGUAGE_AUTO,
  ];

  for (const resolver of resolvers) {
    const language = resolver();
    if (language) {
      return language;
    }
  }
  return SYSTEM_LANGUAGE_AUTO;
}
