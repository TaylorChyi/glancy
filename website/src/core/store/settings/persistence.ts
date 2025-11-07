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
