import type { StateCreator } from "zustand";
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
} from "../persistence.js";
import {
  type DictionaryLegacyLanguage,
  type SettingsState,
  type SystemLanguage,
} from "../model.js";

export type SettingsSetter = Parameters<StateCreator<SettingsState>>[0];
export type SettingsGetter = Parameters<StateCreator<SettingsState>>[1];

const persistSystemLanguage = (
  storage: Storage | undefined,
  language: SystemLanguage,
) => {
  if (storage) {
    persistLegacySystemLanguage(storage, language);
  }
};

export const createSystemLanguageSetter = (
  storage: Storage | undefined,
  set: SettingsSetter,
  get: SettingsGetter,
) =>
  (language: SystemLanguage) => {
    const normalized = sanitizeSystemLanguage(language);
    if (get().systemLanguage === normalized) {
      persistSystemLanguage(storage, normalized);
      return;
    }
    set({ systemLanguage: normalized });
    persistSystemLanguage(storage, normalized);
  };

type DictionaryKey = "dictionarySourceLanguage" | "dictionaryTargetLanguage";

export const createDictionarySetter = <K extends DictionaryKey>(options: {
  key: K;
  normalize: (language: SettingsState[K]) => SettingsState[K];
  set: SettingsSetter;
}) =>
  (language: SettingsState[K]) => {
    const normalized = options.normalize(language);
    options.set((state) =>
      state[options.key] === normalized ? {} : { [options.key]: normalized },
    );
  };

export const buildDictionaryLanguageSetters = (set: SettingsSetter) => ({
  setDictionarySourceLanguage: createDictionarySetter({
    key: "dictionarySourceLanguage",
    normalize: normalizeDictionarySourceLanguage,
    set,
  }),
  setDictionaryTargetLanguage: createDictionarySetter({
    key: "dictionaryTargetLanguage",
    normalize: normalizeDictionaryTargetLanguage,
    set,
  }),
});

export const createMarkdownModeSetter = (set: SettingsSetter) =>
  (mode: SettingsState["markdownRenderingMode"]) => {
    const normalized = normalizeMarkdownRenderingMode(mode);
    set((state) =>
      state.markdownRenderingMode === normalized
        ? {}
        : { markdownRenderingMode: normalized },
    );
  };

export const createLegacyDictionarySetter = (set: SettingsSetter) =>
  (language: DictionaryLegacyLanguage) => {
    const normalized = normalizeLegacyDictionaryLanguage(language);
    const preference = resolveDictionaryPreferenceFromLegacy(normalized);
    set(() => preference);
  };

export const createSettingsActions = (
  storage: Storage | undefined,
  set: SettingsSetter,
  get: SettingsGetter,
) => ({
  setSystemLanguage: createSystemLanguageSetter(storage, set, get),
  ...buildDictionaryLanguageSetters(set),
  setMarkdownRenderingMode: createMarkdownModeSetter(set),
  setDictionaryLanguage: createLegacyDictionarySetter(set),
});
