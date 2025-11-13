import { useCallback, useMemo } from "react";
import { SYSTEM_LANGUAGE_AUTO } from "@core/i18n/languages.js";

const toLowerCase = (value) => String(value ?? "").toLowerCase();

export const useGeneralSectionHandlers = ({
  theme,
  setTheme,
  systemLanguage,
  setSystemLanguage,
  markdownMode,
  setMarkdownMode,
}) => {
  const normalizeSystemLanguage = useCallback((value) => {
    if (value == null) {
      return SYSTEM_LANGUAGE_AUTO.toUpperCase();
    }
    const normalized = String(value).toUpperCase();
    return normalized || SYSTEM_LANGUAGE_AUTO.toUpperCase();
  }, []);

  const handleThemeSelect = useCallback(
    (nextTheme) => {
      if (!nextTheme || nextTheme === theme) {
        return;
      }
      setTheme(nextTheme);
    },
    [setTheme, theme],
  );

  const handleLanguageSelect = useCallback(
    (nextValue) => {
      const fallback = SYSTEM_LANGUAGE_AUTO;
      const normalized = toLowerCase(nextValue) || fallback;
      if (normalized === systemLanguage) {
        return;
      }
      setSystemLanguage(normalized);
    },
    [setSystemLanguage, systemLanguage],
  );

  const handleMarkdownModeSelect = useCallback(
    (nextMode) => {
      if (!nextMode || nextMode === markdownMode) {
        return;
      }
      setMarkdownMode(nextMode);
    },
    [markdownMode, setMarkdownMode],
  );

  return useMemo(
    () => ({
      normalizeSystemLanguage,
      onThemeSelect: handleThemeSelect,
      onLanguageSelect: handleLanguageSelect,
      onMarkdownModeSelect: handleMarkdownModeSelect,
    }),
    [
      handleLanguageSelect,
      handleMarkdownModeSelect,
      handleThemeSelect,
      normalizeSystemLanguage,
    ],
  );
};

export default useGeneralSectionHandlers;
