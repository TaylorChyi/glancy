import { useCallback, useId } from "react";
import PropTypes from "prop-types";
import { useLanguage, useTheme } from "@core/context";
import { SYSTEM_LANGUAGE_AUTO } from "@core/i18n/languages.js";
import {
  MARKDOWN_RENDERING_MODE_DYNAMIC,
  MARKDOWN_RENDERING_MODE_PLAIN,
  SUPPORTED_SYSTEM_LANGUAGES,
  useSettingsStore,
} from "@core/store/settings";
import GeneralSectionView from "./GeneralSection/GeneralSectionView.jsx";
import { createGeneralSectionViewModel } from "./GeneralSection/viewModel";

const MARKDOWN_RENDER_MODE_ORDER = Object.freeze([
  MARKDOWN_RENDERING_MODE_DYNAMIC,
  MARKDOWN_RENDERING_MODE_PLAIN,
]);

function useGeneralSectionController({ title, headingId }) {
  const { theme, setTheme } = useTheme();
  const { t, systemLanguage, setSystemLanguage } = useLanguage();
  const markdownRenderingMode = useSettingsStore(
    (state) => state.markdownRenderingMode,
  );
  const setMarkdownRenderingMode = useSettingsStore(
    (state) => state.setMarkdownRenderingMode,
  );

  const ids = {
    theme: useId(),
    language: useId(),
    markdown: useId(),
  };

  const normalizeSystemLanguage = useCallback((value) => {
    if (value == null) {
      return SYSTEM_LANGUAGE_AUTO.toUpperCase();
    }
    if (value === SYSTEM_LANGUAGE_AUTO) {
      return SYSTEM_LANGUAGE_AUTO.toUpperCase();
    }
    return String(value).toUpperCase();
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
      const normalized =
        typeof nextValue === "string"
          ? nextValue.toLowerCase()
          : String(nextValue ?? fallback).toLowerCase();
      const target = normalized || fallback;
      if (target === systemLanguage) {
        return;
      }
      setSystemLanguage(target);
    },
    [setSystemLanguage, systemLanguage],
  );

  const handleMarkdownModeSelect = useCallback(
    (nextMode) => {
      if (!nextMode || nextMode === markdownRenderingMode) {
        return;
      }
      setMarkdownRenderingMode(nextMode);
    },
    [markdownRenderingMode, setMarkdownRenderingMode],
  );

  return createGeneralSectionViewModel({
    title,
    headingId,
    ids,
    theme,
    systemLanguage,
    markdownMode: markdownRenderingMode,
    translations: t,
    availableLanguages: SUPPORTED_SYSTEM_LANGUAGES,
    systemLanguageAutoValue: SYSTEM_LANGUAGE_AUTO,
    markdownModes: MARKDOWN_RENDER_MODE_ORDER,
    handlers: {
      onThemeSelect: handleThemeSelect,
      onLanguageSelect: handleLanguageSelect,
      onMarkdownModeSelect: handleMarkdownModeSelect,
      normalizeSystemLanguage,
    },
  });
}

function GeneralSectionContainer({ title, headingId }) {
  const viewModel = useGeneralSectionController({ title, headingId });
  return <GeneralSectionView {...viewModel} />;
}

GeneralSectionContainer.propTypes = {
  title: PropTypes.string.isRequired,
  headingId: PropTypes.string.isRequired,
};

export default GeneralSectionContainer;
