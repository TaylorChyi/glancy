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

type SettingsSetter = Parameters<StateCreator<SettingsState>>[0];
type SettingsGetter = Parameters<StateCreator<SettingsState>>[1];

const persistSystemLanguage = (
  storage: Storage | undefined,
  language: SystemLanguage,
) => {
  if (storage) {
    persistLegacySystemLanguage(storage, language);
  }
};

const createSystemLanguageSetter = (
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

const createDictionarySetter = <K extends DictionaryKey>(options: {
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

const buildDictionaryLanguageSetters = (set: SettingsSetter) => ({
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

const createMarkdownModeSetter = (set: SettingsSetter) =>
  (mode: SettingsState["markdownRenderingMode"]) => {
    const normalized = normalizeMarkdownRenderingMode(mode);
    set((state) =>
      state.markdownRenderingMode === normalized
        ? {}
        : { markdownRenderingMode: normalized },
    );
  };

const createLegacyDictionarySetter = (set: SettingsSetter) =>
  (language: DictionaryLegacyLanguage) => {
    const normalized = normalizeLegacyDictionaryLanguage(language);
    const preference = resolveDictionaryPreferenceFromLegacy(normalized);
    set(() => preference);
  };

const createSettingsActions = (
  storage: Storage | undefined,
  set: SettingsSetter,
  get: SettingsGetter,
) => ({
  setSystemLanguage: createSystemLanguageSetter(storage, set, get),
  ...buildDictionaryLanguageSetters(set),
  setMarkdownRenderingMode: createMarkdownModeSetter(set),
  setDictionaryLanguage: createLegacyDictionarySetter(set),
});

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
    const actions = createSettingsActions(storage, set, get);
    return {
      ...initialSlice,
      ...actions,
    } satisfies SettingsState;
  };
};
