import type { PersistOptions } from "zustand/middleware";
import {
  normalizeLegacyDictionaryLanguage,
  normalizeMarkdownRenderingMode,
  resolveDictionaryPreference,
} from "../normalizers.js";
import {
  extractDictionaryPersistence,
  persistLegacySystemLanguage,
  readPersistedSettingsSnapshot,
} from "../persistence.js";
import type { SettingsState } from "../model.js";

type RehydrateHandler = NonNullable<
  PersistOptions<SettingsState>["onRehydrateStorage"]
>;

export const createSettingsRehydrationHandler = (
  storage: Storage | undefined,
): RehydrateHandler => {
  return () => (state) => {
    if (!state || !storage) {
      return;
    }
    const snapshot = readPersistedSettingsSnapshot(storage);
    const { source, target, hasSource, hasTarget } =
      extractDictionaryPersistence(snapshot);
    persistLegacySystemLanguage(storage, state.systemLanguage);
    const legacyLanguage = normalizeLegacyDictionaryLanguage(
      (state as unknown as { dictionaryLanguage?: string }).dictionaryLanguage,
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
  };
};
