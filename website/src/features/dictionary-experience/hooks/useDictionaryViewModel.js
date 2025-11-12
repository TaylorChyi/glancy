import { useMemo } from "react";
import { DICTIONARY_EXPERIENCE_VIEWS } from "../dictionaryExperienceViews.js";
import { buildDictionaryActionBarModel } from "./buildDictionaryActionBarModel.js";

const resolveViewFlags = (activeView) => ({
  active: activeView,
  isDictionary: activeView === DICTIONARY_EXPERIENCE_VIEWS.DICTIONARY,
  isHistory: activeView === DICTIONARY_EXPERIENCE_VIEWS.HISTORY,
  isLibrary: activeView === DICTIONARY_EXPERIENCE_VIEWS.LIBRARY,
});

const buildActionBarProps = ({
  state,
  requests,
  copyController,
  reporting,
  languageContext,
}) => {
  const activeTerm = state.entry?.term || state.currentTerm;
  const isDictionaryViewActive =
    state.activeView === DICTIONARY_EXPERIENCE_VIEWS.DICTIONARY;
  return buildDictionaryActionBarModel({
    resolvedTerm: activeTerm,
    lang: languageContext.lang,
    handleReoutput: requests.handleReoutput,
    isTermActionable: isDictionaryViewActive && Boolean(activeTerm),
    loading: state.loading,
    handleCopy: copyController.handleCopy,
    canCopyDefinition: copyController.canCopyDefinition,
    copyFeedbackState: copyController.copyFeedbackState,
    isCopySuccessActive: copyController.isCopySuccessActive,
    handleDeleteHistory: requests.handleDeleteHistory,
    entry: state.entry,
    finalText: state.finalText,
    handleReport: reporting.handleReport,
  });
};

const resolveEmptyState = (t) => ({
  title: t.searchEmptyTitle,
  description: t.searchEmptyDescription,
});

export function useDictionaryViewModel({ core, requests }) {
  const { state, contexts, copyController, homeControls, reporting, libraryLandingLabel } =
    core;
  const { languageContext, toast, popup, languageConfig } = contexts;
  const viewState = resolveViewFlags(state.activeView);
  const dictionaryActionBarProps = useMemo(
    () =>
      buildActionBarProps({
        state,
        requests,
        copyController,
        reporting,
        languageContext,
      }),
    [
      state,
      requests,
      copyController,
      reporting,
      languageContext,
    ],
  );
  const isEmptyStateActive =
    viewState.isDictionary && !state.entry && !state.finalText && !state.loading;
  const displayClassName = ["display", isEmptyStateActive ? "display-empty" : ""]
    .filter(Boolean)
    .join(" ");

  return {
    inputRef: state.inputRef,
    t: languageContext.t,
    text: state.text,
    setText: state.setText,
    dictionarySourceLanguage: languageConfig.dictionarySourceLanguage,
    setDictionarySourceLanguage: languageConfig.setDictionarySourceLanguage,
    dictionaryTargetLanguage: languageConfig.dictionaryTargetLanguage,
    setDictionaryTargetLanguage: languageConfig.setDictionaryTargetLanguage,
    sourceLanguageOptions: languageConfig.sourceLanguageOptions,
    targetLanguageOptions: languageConfig.targetLanguageOptions,
    handleSwapLanguages: languageConfig.handleSwapLanguages,
    handleSend: requests.handleSend,
    handleShowDictionary: homeControls.handleShowDictionary,
    handleShowLibrary: homeControls.handleShowLibrary,
    handleSelectHistory: requests.handleSelectHistory,
    activeView: state.activeView,
    viewState,
    focusInput: homeControls.focusInput,
    entry: state.entry,
    finalText: state.finalText,
    loading: state.loading,
    dictionaryActionBarProps,
    displayClassName,
    isEmptyStateActive,
    popupOpen: popup.popupOpen,
    popupMsg: popup.popupMsg,
    popupConfig: popup.popupConfig,
    closePopup: popup.closePopup,
    toast: toast.state,
    closeToast: toast.closeToast,
    reportDialog: reporting.reportDialog,
    reportDialogHandlers: reporting.reportDialogHandlers,
    canCopyDefinition: copyController.canCopyDefinition,
    handleCopy: copyController.handleCopy,
    lang: languageContext.lang,
    dictionaryFlavor: languageConfig.dictionaryFlavor,
    libraryLandingLabel,
    dictionaryTargetLanguageLabel: languageContext.t.dictionaryTargetLanguageLabel,
    dictionarySourceLanguageLabel: languageContext.t.dictionarySourceLanguageLabel,
    dictionarySwapLanguagesLabel: languageContext.t.dictionarySwapLanguages,
    searchEmptyState: resolveEmptyState(languageContext.t),
    chatInputPlaceholder: languageContext.t.inputPlaceholder,
  };
}
