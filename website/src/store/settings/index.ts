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
  normalizeWordSourceLanguage,
  normalizeWordTargetLanguage,
  WORD_DEFAULT_TARGET_LANGUAGE,
} from "@/utils/language.js";

const LEGACY_LANGUAGE_STORAGE_KEY = "lang";
const SETTINGS_STORAGE_KEY = "settings";
const DEFAULT_LANGUAGE_FALLBACK = "zh";

type SystemLanguage = typeof SYSTEM_LANGUAGE_AUTO | string;

type DictionarySourceLanguage =
  | typeof WORD_LANGUAGE_AUTO
  | "CHINESE"
  | "ENGLISH";

type DictionaryTargetLanguage = "CHINESE" | "ENGLISH";

type SettingsState = {
  systemLanguage: SystemLanguage;
  setSystemLanguage: (language: SystemLanguage) => void;
  dictionarySourceLanguage: DictionarySourceLanguage;
  setDictionarySourceLanguage: (language: DictionarySourceLanguage) => void;
  dictionaryTargetLanguage: DictionaryTargetLanguage;
  setDictionaryTargetLanguage: (language: DictionaryTargetLanguage) => void;
  /**
   * @deprecated 请改用 setDictionarySourceLanguage / setDictionaryTargetLanguage
   */
  setDictionaryLanguage: (language: DictionaryLegacyLanguage) => void;
};

type DictionaryLegacyLanguage =
  | typeof WORD_LANGUAGE_AUTO
  | "CHINESE"
  | "ENGLISH"
  | typeof WORD_LANGUAGE_ENGLISH_MONO;

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
    dictionarySourceLanguage: WORD_LANGUAGE_AUTO,
    dictionaryTargetLanguage: WORD_DEFAULT_TARGET_LANGUAGE,
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
    setDictionarySourceLanguage: (language: DictionarySourceLanguage) => {
      const normalized = normalizeWordSourceLanguage(language);
      set((state) => {
        if (state.dictionarySourceLanguage === normalized) {
          return {};
        }
        return { dictionarySourceLanguage: normalized };
      });
    },
    setDictionaryTargetLanguage: (language: DictionaryTargetLanguage) => {
      const normalized = normalizeWordTargetLanguage(language);
      set((state) => {
        if (state.dictionaryTargetLanguage === normalized) {
          return {};
        }
        return { dictionaryTargetLanguage: normalized };
      });
    },
    setDictionaryLanguage: (language: DictionaryLegacyLanguage) => {
      const normalized = normalizeWordLanguage(language);
      set(() => {
        switch (normalized) {
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
      });
    },
  }),
  persistOptions: {
    partialize: pickState([
      "systemLanguage",
      "dictionarySourceLanguage",
      "dictionaryTargetLanguage",
    ]),
    onRehydrateStorage: () => (state) => {
      if (state) {
        let persistedState: { state?: Record<string, unknown> } | null = null;
        try {
          const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
          persistedState = raw ? JSON.parse(raw) : null;
        } catch (error) {
          console.warn("[settings] failed to parse persisted state", error);
        }
        const hasPersistedSource = Boolean(
          persistedState?.state?.dictionarySourceLanguage,
        );
        const hasPersistedTarget = Boolean(
          persistedState?.state?.dictionaryTargetLanguage,
        );
        persistLegacyLanguage(state.systemLanguage);
        const legacyLanguage =
          "dictionaryLanguage" in state
            ? normalizeWordLanguage(
                (state as unknown as { dictionaryLanguage?: string })
                  .dictionaryLanguage,
              )
            : undefined;
        const persistedSource = normalizeWordSourceLanguage(
          (state as unknown as { dictionarySourceLanguage?: string })
            .dictionarySourceLanguage,
        );
        const persistedTarget = normalizeWordTargetLanguage(
          (state as unknown as { dictionaryTargetLanguage?: string })
            .dictionaryTargetLanguage,
        );

        if (legacyLanguage && !hasPersistedSource && !hasPersistedTarget) {
          switch (legacyLanguage) {
            case "CHINESE":
              state.dictionarySourceLanguage = "CHINESE";
              state.dictionaryTargetLanguage = "ENGLISH";
              break;
            case "ENGLISH":
              state.dictionarySourceLanguage = "ENGLISH";
              state.dictionaryTargetLanguage = WORD_DEFAULT_TARGET_LANGUAGE;
              break;
            case WORD_LANGUAGE_ENGLISH_MONO:
              state.dictionarySourceLanguage = "ENGLISH";
              state.dictionaryTargetLanguage = "ENGLISH";
              break;
            default:
              state.dictionarySourceLanguage = WORD_LANGUAGE_AUTO;
              state.dictionaryTargetLanguage = WORD_DEFAULT_TARGET_LANGUAGE;
              break;
          }
        } else {
          state.dictionarySourceLanguage = persistedSource;
          state.dictionaryTargetLanguage = persistedTarget;
        }
      }
    },
  },
});

export const SUPPORTED_SYSTEM_LANGUAGES = getSupportedLanguageCodes();
