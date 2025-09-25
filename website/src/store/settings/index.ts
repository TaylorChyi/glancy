import { createPersistentStore } from "../createPersistentStore.js";
import { pickState } from "../persistUtils.js";
import {
  SYSTEM_LANGUAGE_AUTO,
  getSupportedLanguageCodes,
  isSupportedLanguage,
} from "@/i18n/languages.js";
import {
  WORD_LANGUAGE_AUTO,
  WORD_LANGUAGE_ENGLISH_MONO,
  normalizeWordLanguage,
} from "@/utils/language.js";

const LEGACY_LANGUAGE_STORAGE_KEY = "lang";
const SETTINGS_STORAGE_KEY = "settings";
const DEFAULT_LANGUAGE_FALLBACK = "zh";

type SystemLanguage = typeof SYSTEM_LANGUAGE_AUTO | string;

type DictionaryLanguage =
  | typeof WORD_LANGUAGE_AUTO
  | "CHINESE"
  | "ENGLISH"
  | typeof WORD_LANGUAGE_ENGLISH_MONO;

type SettingsState = {
  systemLanguage: SystemLanguage;
  setSystemLanguage: (language: SystemLanguage) => void;
  dictionaryLanguage: DictionaryLanguage;
  setDictionaryLanguage: (language: DictionaryLanguage) => void;
};

function sanitizeLanguage(candidate: SystemLanguage): SystemLanguage {
  if (candidate === SYSTEM_LANGUAGE_AUTO) {
    return SYSTEM_LANGUAGE_AUTO;
  }
  if (isSupportedLanguage(candidate)) {
    return candidate;
  }
  return DEFAULT_LANGUAGE_FALLBACK;
}

function detectInitialLanguage(): SystemLanguage {
  const persisted = localStorage.getItem(SETTINGS_STORAGE_KEY);
  if (persisted) {
    try {
      const data = JSON.parse(persisted);
      const candidate = data?.state?.systemLanguage;
      if (candidate && isSupportedLanguage(candidate)) {
        return candidate;
      }
    } catch (error) {
      console.warn("[settings] failed to parse persisted state", error);
    }
  }
  const legacy = localStorage.getItem(LEGACY_LANGUAGE_STORAGE_KEY);
  if (legacy && isSupportedLanguage(legacy)) {
    return legacy;
  }
  return SYSTEM_LANGUAGE_AUTO;
}

function persistLegacyLanguage(language: SystemLanguage) {
  if (language === SYSTEM_LANGUAGE_AUTO) {
    localStorage.removeItem(LEGACY_LANGUAGE_STORAGE_KEY);
    return;
  }
  if (isSupportedLanguage(language)) {
    localStorage.setItem(LEGACY_LANGUAGE_STORAGE_KEY, language);
  }
}

export const useSettingsStore = createPersistentStore<SettingsState>({
  key: SETTINGS_STORAGE_KEY,
  initializer: (set, get) => ({
    systemLanguage: detectInitialLanguage(),
    dictionaryLanguage: WORD_LANGUAGE_AUTO,
    setSystemLanguage: (language: SystemLanguage) => {
      const normalized = sanitizeLanguage(language);
      const current = get().systemLanguage;
      if (current === normalized) {
        persistLegacyLanguage(normalized);
        return;
      }
      set({ systemLanguage: normalized });
      persistLegacyLanguage(normalized);
    },
    setDictionaryLanguage: (language: DictionaryLanguage) => {
      const normalized = normalizeWordLanguage(language) as DictionaryLanguage;
      set((state) => {
        if (state.dictionaryLanguage === normalized) {
          return {};
        }
        return { dictionaryLanguage: normalized };
      });
    },
  }),
  persistOptions: {
    partialize: pickState(["systemLanguage", "dictionaryLanguage"]),
    onRehydrateStorage: () => (state) => {
      if (state) {
        persistLegacyLanguage(state.systemLanguage);
        state.dictionaryLanguage = normalizeWordLanguage(
          state.dictionaryLanguage,
        ) as DictionaryLanguage;
      }
    },
  },
});

export const SUPPORTED_SYSTEM_LANGUAGES = getSupportedLanguageCodes();
