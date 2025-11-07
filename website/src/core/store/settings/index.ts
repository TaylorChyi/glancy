import { createPersistentStore } from "../createPersistentStore.js";
import { pickState } from "../persistUtils.js";
import {
  DEFAULT_SETTINGS_SLICE,
  DictionaryLegacyLanguage,
  MARKDOWN_RENDERING_MODE_DYNAMIC,
  MARKDOWN_RENDERING_MODE_PLAIN,
  MARKDOWN_RENDERING_MODES,
  SETTINGS_STORAGE_KEY,
  SUPPORTED_SYSTEM_LANGUAGES,
  type SettingsSlice,
  type SettingsState,
  type SystemLanguage,
} from "./model.js";
import {
  normalizeDictionarySourceLanguage,
  normalizeDictionaryTargetLanguage,
  normalizeLegacyDictionaryLanguage,
  normalizeMarkdownRenderingMode,
  resolveDictionaryPreference,
  resolveDictionaryPreferenceFromLegacy,
  sanitizeSystemLanguage,
} from "./normalizers.js";
import {
  extractDictionaryPersistence,
  persistLegacySystemLanguage,
  readPersistedSettingsSnapshot,
  resolveInitialSystemLanguage,
} from "./persistence.js";

const STORAGE = typeof window === "undefined" ? undefined : window.localStorage;

export const useSettingsStore = createPersistentStore<SettingsState>({
  key: SETTINGS_STORAGE_KEY,
  initializer: (set, get) => {
    const initialSlice = {
      ...DEFAULT_SETTINGS_SLICE,
      systemLanguage: STORAGE
        ? resolveInitialSystemLanguage(STORAGE)
        : DEFAULT_SETTINGS_SLICE.systemLanguage,
    } satisfies SettingsSlice;

    return {
      ...initialSlice,
      setSystemLanguage: (language: SystemLanguage) => {
        const normalized = sanitizeSystemLanguage(language);
        const current = get().systemLanguage;
        if (current === normalized) {
          if (STORAGE) {
            persistLegacySystemLanguage(STORAGE, normalized);
          }
          return;
        }
        set({ systemLanguage: normalized });
        if (STORAGE) {
          persistLegacySystemLanguage(STORAGE, normalized);
        }
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
  },
  persistOptions: {
    partialize: pickState([
      "systemLanguage",
      "dictionarySourceLanguage",
      "dictionaryTargetLanguage",
      "markdownRenderingMode",
    ]),
    onRehydrateStorage: () => (state) => {
      if (!state || !STORAGE) {
        return;
      }
      const snapshot = readPersistedSettingsSnapshot(STORAGE);
      const { source, target, hasSource, hasTarget } =
        extractDictionaryPersistence(snapshot);
      persistLegacySystemLanguage(STORAGE, state.systemLanguage);
      const legacyLanguage = normalizeLegacyDictionaryLanguage(
        (state as unknown as { dictionaryLanguage?: string })
          .dictionaryLanguage,
      );
      state.markdownRenderingMode = normalizeMarkdownRenderingMode(
        state.markdownRenderingMode,
      );
      const preference = resolveDictionaryPreference({
        legacyLanguage,
        persistedSource: source,
        persistedTarget: target,
        hasPersistedSource: hasSource,
        hasPersistedTarget: hasTarget,
      });
      state.dictionarySourceLanguage = preference.dictionarySourceLanguage;
      state.dictionaryTargetLanguage = preference.dictionaryTargetLanguage;
    },
  },
});

export { SUPPORTED_SYSTEM_LANGUAGES };
export {
  MARKDOWN_RENDERING_MODE_DYNAMIC,
  MARKDOWN_RENDERING_MODE_PLAIN,
  MARKDOWN_RENDERING_MODES,
};
