import { useCallback, useMemo } from "react";
import { SYSTEM_LANGUAGE_AUTO } from "@core/i18n/languages.js";

const toLowerCase = (value) => String(value ?? "").toLowerCase();
const toUpperCase = (value) => String(value ?? "").toUpperCase();

const normalizeSystemLanguageValue = (value) => {
  const fallback = toUpperCase(SYSTEM_LANGUAGE_AUTO);
  if (value == null) {
    return fallback;
  }
  const normalized = toUpperCase(value);
  return normalized || fallback;
};

const applyThemeSelection = (nextTheme, theme, setTheme) => {
  if (!nextTheme || nextTheme === theme) {
    return;
  }
  setTheme(nextTheme);
};

const applyLanguageSelection = (
  nextValue,
  systemLanguage,
  setSystemLanguage,
) => {
  const normalized = toLowerCase(nextValue) || SYSTEM_LANGUAGE_AUTO;
  if (normalized === systemLanguage) {
    return;
  }
  setSystemLanguage(normalized);
};

const applyMarkdownModeSelection = (
  nextMode,
  markdownMode,
  setMarkdownMode,
) => {
  if (!nextMode || nextMode === markdownMode) {
    return;
  }
  setMarkdownMode(nextMode);
};

const useNormalizeSystemLanguage = () =>
  useCallback(normalizeSystemLanguageValue, []);

const useThemeSelect = (theme, setTheme) =>
  useCallback(
    (nextTheme) => applyThemeSelection(nextTheme, theme, setTheme),
    [setTheme, theme],
  );

const useLanguageSelect = (systemLanguage, setSystemLanguage) =>
  useCallback(
    (nextValue) =>
      applyLanguageSelection(nextValue, systemLanguage, setSystemLanguage),
    [setSystemLanguage, systemLanguage],
  );

const useMarkdownModeSelect = (markdownMode, setMarkdownMode) =>
  useCallback(
    (nextMode) =>
      applyMarkdownModeSelection(nextMode, markdownMode, setMarkdownMode),
    [markdownMode, setMarkdownMode],
  );

export const useGeneralSectionHandlers = ({
  theme,
  setTheme,
  systemLanguage,
  setSystemLanguage,
  markdownMode,
  setMarkdownMode,
}) => {
  const normalizeSystemLanguage = useNormalizeSystemLanguage();
  const onThemeSelect = useThemeSelect(theme, setTheme);
  const onLanguageSelect = useLanguageSelect(systemLanguage, setSystemLanguage);
  const onMarkdownModeSelect = useMarkdownModeSelect(markdownMode, setMarkdownMode);

  return useMemo(
    () => ({
      normalizeSystemLanguage,
      onThemeSelect,
      onLanguageSelect,
      onMarkdownModeSelect,
    }),
    [
      normalizeSystemLanguage,
      onThemeSelect,
      onLanguageSelect,
      onMarkdownModeSelect,
    ],
  );
};

export default useGeneralSectionHandlers;
