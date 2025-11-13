import PropTypes from "prop-types";
import { SYSTEM_LANGUAGE_AUTO } from "@core/i18n/languages.js";
import {
  MARKDOWN_RENDERING_MODE_DYNAMIC,
  MARKDOWN_RENDERING_MODE_PLAIN,
  SUPPORTED_SYSTEM_LANGUAGES,
} from "@core/store/settings";
import GeneralSectionView from "./GeneralSection/GeneralSectionView.jsx";
import { createGeneralSectionViewModel } from "./GeneralSection/viewModel";
import { useGeneralSectionFieldIds } from "./GeneralSection/useGeneralSectionFieldIds.js";
import { useGeneralSectionHandlers } from "./GeneralSection/useGeneralSectionHandlers.js";
import { useGeneralSectionSettings } from "./GeneralSection/useGeneralSectionSettings.js";

const MARKDOWN_RENDER_MODE_ORDER = Object.freeze([
  MARKDOWN_RENDERING_MODE_DYNAMIC,
  MARKDOWN_RENDERING_MODE_PLAIN,
]);

function useGeneralSectionSettingsState() {
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
  };
}

function useGeneralSectionViewModel({ title, headingId }) {
  const {
    ids,
    theme,
    systemLanguage,
    markdownMode,
    translations,
    handlers,
  } = useGeneralSectionSettingsState();

  return createGeneralSectionViewModel({
    title,
    headingId,
    ids,
    theme,
    systemLanguage,
    markdownMode,
    translations,
    availableLanguages: SUPPORTED_SYSTEM_LANGUAGES,
    systemLanguageAutoValue: SYSTEM_LANGUAGE_AUTO,
    markdownModes: MARKDOWN_RENDER_MODE_ORDER,
    handlers,
  });
}

function GeneralSectionContainer({ title, headingId }) {
  const viewModel = useGeneralSectionViewModel({ title, headingId });
  return <GeneralSectionView {...viewModel} />;
}

GeneralSectionContainer.propTypes = {
  title: PropTypes.string.isRequired,
  headingId: PropTypes.string.isRequired,
};

export default GeneralSectionContainer;
