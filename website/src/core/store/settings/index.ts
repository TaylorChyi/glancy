import { createPersistentStore } from "../createPersistentStore.js";
import { pickState } from "../persistUtils.js";
import {
  MARKDOWN_RENDERING_MODE_DYNAMIC,
  MARKDOWN_RENDERING_MODE_PLAIN,
  MARKDOWN_RENDERING_MODES,
  SETTINGS_STORAGE_KEY,
  SUPPORTED_SYSTEM_LANGUAGES,
  type SettingsState,
} from "./model.js";
import { createSettingsStoreInitializer } from "./initializers/createSettingsStoreInitializer.ts";
import { createSettingsRehydrationHandler } from "./migrations/createSettingsRehydration.ts";

const STORAGE = typeof window === "undefined" ? undefined : window.localStorage;

export const useSettingsStore = createPersistentStore<SettingsState>({
  key: SETTINGS_STORAGE_KEY,
  initializer: createSettingsStoreInitializer(STORAGE),
  persistOptions: {
    partialize: pickState([
      "systemLanguage",
      "dictionarySourceLanguage",
      "dictionaryTargetLanguage",
      "markdownRenderingMode",
    ]),
    onRehydrateStorage: createSettingsRehydrationHandler(STORAGE),
  },
});

export { SUPPORTED_SYSTEM_LANGUAGES };
export {
  MARKDOWN_RENDERING_MODE_DYNAMIC,
  MARKDOWN_RENDERING_MODE_PLAIN,
  MARKDOWN_RENDERING_MODES,
};
