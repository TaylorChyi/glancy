import { act } from "@testing-library/react";
import {
  MARKDOWN_RENDERING_MODE_DYNAMIC,
  useSettingsStore,
} from "@core/store/settings";
import { SYSTEM_LANGUAGE_AUTO } from "@core/i18n/languages.js";
import {
  WORD_LANGUAGE_AUTO,
  WORD_DEFAULT_TARGET_LANGUAGE,
} from "@shared/utils/language.js";

type SettingsStoreState = ReturnType<typeof useSettingsStore.getState>;

type SettingsOperation = (state: SettingsStoreState) => void;

export const resetSettingsStore = () => {
  localStorage.clear();
  const state = useSettingsStore.getState();
  useSettingsStore.setState(
    {
      systemLanguage: SYSTEM_LANGUAGE_AUTO,
      setSystemLanguage: state.setSystemLanguage,
      dictionarySourceLanguage: WORD_LANGUAGE_AUTO,
      setDictionarySourceLanguage: state.setDictionarySourceLanguage,
      dictionaryTargetLanguage: WORD_DEFAULT_TARGET_LANGUAGE,
      setDictionaryTargetLanguage: state.setDictionaryTargetLanguage,
      markdownRenderingMode: MARKDOWN_RENDERING_MODE_DYNAMIC,
      setMarkdownRenderingMode: state.setMarkdownRenderingMode,
      setDictionaryLanguage: state.setDictionaryLanguage,
    },
    true,
  );
};

export const withSettingsStore = (operation: SettingsOperation) => {
  act(() => {
    operation(useSettingsStore.getState());
  });
};

export const readSettingsStore = () => useSettingsStore.getState();
