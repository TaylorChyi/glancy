import { SYSTEM_LANGUAGE_AUTO } from "@core/i18n/languages.js";
import {
  MARKDOWN_RENDERING_MODE_DYNAMIC,
  MARKDOWN_RENDERING_MODE_PLAIN,
  SUPPORTED_SYSTEM_LANGUAGES,
} from "@core/store/settings";
import { useGeneralSectionFieldIds } from "./useGeneralSectionFieldIds.js";
import { useGeneralSectionHandlers } from "./useGeneralSectionHandlers.js";
import { useGeneralSectionSettings } from "./useGeneralSectionSettings.js";

export const MARKDOWN_RENDER_MODE_ORDER = Object.freeze([
  MARKDOWN_RENDERING_MODE_DYNAMIC,
  MARKDOWN_RENDERING_MODE_PLAIN,
]);

export const useGeneralSectionSettingsState = () => {
  const ids = useGeneralSectionFieldIds();
  const {
    theme,
    setTheme,
    systemLanguage,
    setSystemLanguage,
    markdownMode,
    setMarkdownMode,
    translations,
  } = useGeneralSectionSettings();

  const handlers = useGeneralSectionHandlers({
    theme,
    setTheme,
    systemLanguage,
    setSystemLanguage,
    markdownMode,
    setMarkdownMode,
  });

  return {
    ids,
    theme,
    systemLanguage,
    markdownMode,
    translations,
    handlers,
    availableLanguages: SUPPORTED_SYSTEM_LANGUAGES,
    systemLanguageAutoValue: SYSTEM_LANGUAGE_AUTO,
  };
};

export default useGeneralSectionSettingsState;
