import type { StateCreator } from "zustand";
import {
  DEFAULT_SETTINGS_SLICE,
  type DictionaryLegacyLanguage,
  type SettingsSlice,
  type SettingsState,
  type SystemLanguage,
} from "../model.js";
import {
  normalizeDictionarySourceLanguage,
  normalizeDictionaryTargetLanguage,
  normalizeLegacyDictionaryLanguage,
  normalizeMarkdownRenderingMode,
  resolveDictionaryPreferenceFromLegacy,
  sanitizeSystemLanguage,
} from "../normalizers.js";
import {
  persistLegacySystemLanguage,
  resolveInitialSystemLanguage,
} from "../persistence.js";

const persistSystemLanguage = (
  storage: Storage | undefined,
  language: SystemLanguage,
) => {
  if (storage) {
    persistLegacySystemLanguage(storage, language);
  }
};

const buildInitialSlice = (
  storage: Storage | undefined,
): SettingsSlice => ({
  ...DEFAULT_SETTINGS_SLICE,
  systemLanguage: storage
    ? resolveInitialSystemLanguage(storage)
    : DEFAULT_SETTINGS_SLICE.systemLanguage,
});

export const createSettingsStoreInitializer = (
  storage: Storage | undefined,
): StateCreator<SettingsState> => {
  return (set, get) => {
    const initialSlice = buildInitialSlice(storage);
    return {
      ...initialSlice,
      setSystemLanguage: (language: SystemLanguage) => {
        const normalized = sanitizeSystemLanguage(language);
        if (get().systemLanguage === normalized) {
          persistSystemLanguage(storage, normalized);
          return;
        }
        set({ systemLanguage: normalized });
        persistSystemLanguage(storage, normalized);
      },
      setDictionarySourceLanguage: (language) => {
        const normalized = normalizeDictionarySourceLanguage(language);
        set((state) =>
          state.dictionarySourceLanguage === normalized
            ? {}
            : { dictionarySourceLanguage: normalized },
        );
      },
      setDictionaryTargetLanguage: (language) => {
        const normalized = normalizeDictionaryTargetLanguage(language);
        set((state) =>
          state.dictionaryTargetLanguage === normalized
            ? {}
            : { dictionaryTargetLanguage: normalized },
        );
      },
      setMarkdownRenderingMode: (mode) => {
        const normalized = normalizeMarkdownRenderingMode(mode);
        set((state) =>
          state.markdownRenderingMode === normalized
            ? {}
            : { markdownRenderingMode: normalized },
        );
      },
      setDictionaryLanguage: (language: DictionaryLegacyLanguage) => {
        const normalized = normalizeLegacyDictionaryLanguage(language);
        const preference = resolveDictionaryPreferenceFromLegacy(normalized);
        set(() => preference);
      },
    } satisfies SettingsState;
  };
};
