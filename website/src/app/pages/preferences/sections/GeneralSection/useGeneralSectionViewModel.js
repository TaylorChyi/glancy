import { useMemo } from "react";
import { createGeneralSectionViewModel } from "./viewModel";
import {
  MARKDOWN_RENDER_MODE_ORDER,
  useGeneralSectionSettingsState,
} from "./useGeneralSectionSettingsState.js";

const createViewModelArgs = ({
  title,
  headingId,
  ids,
  theme,
  systemLanguage,
  markdownMode,
  translations,
  availableLanguages,
  systemLanguageAutoValue,
  handlers,
}) => ({
  title,
  headingId,
  ids,
  theme,
  systemLanguage,
  markdownMode,
  translations,
  availableLanguages,
  systemLanguageAutoValue,
  markdownModes: MARKDOWN_RENDER_MODE_ORDER,
  handlers,
});

const useViewModelSettingsArgs = () => {
  const {
    ids,
    theme,
    systemLanguage,
    markdownMode,
    translations,
    availableLanguages,
    systemLanguageAutoValue,
    handlers,
  } = useGeneralSectionSettingsState();

  return useMemo(
    () => ({
      ids,
      theme,
      systemLanguage,
      markdownMode,
      translations,
      availableLanguages,
      systemLanguageAutoValue,
      handlers,
    }),
    [availableLanguages, handlers, ids, markdownMode, systemLanguage, systemLanguageAutoValue, theme, translations],
  );
};

export const useGeneralSectionViewModel = ({ title, headingId }) => {
  const settingsArgs = useViewModelSettingsArgs();

  const args = useMemo(
    () => createViewModelArgs({ title, headingId, ...settingsArgs }),
    [headingId, settingsArgs, title],
  );

  return useMemo(() => createGeneralSectionViewModel(args), [args]);
};

export default useGeneralSectionViewModel;
