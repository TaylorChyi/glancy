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

const useDictionaryActionBarProps = ({
  state,
  requests,
  copyController,
  reporting,
  languageContext,
}) =>
  useMemo(
    () =>
      buildActionBarProps({
        state,
        requests,
        copyController,
        reporting,
        languageContext,
      }),
    [state, requests, copyController, reporting, languageContext],
  );

const shouldShowDictionaryEmptyState = (state) =>
  !state.entry && !state.finalText && !state.loading;

const resolveDisplayClassName = (isEmpty) =>
  ["display", isEmpty ? "display-empty" : ""].filter(Boolean).join(" ");

const resolveDisplayState = (state, viewState) => {
  const isEmptyStateActive =
    viewState.isDictionary && shouldShowDictionaryEmptyState(state);
  return {
    isEmptyStateActive,
    displayClassName: resolveDisplayClassName(isEmptyStateActive),
  };
};

const buildSearchEmptyState = (t) => ({
  title: t.searchEmptyTitle,
  description: t.searchEmptyDescription,
});

const buildStateProps = (state) => ({
  inputRef: state.inputRef,
  text: state.text,
  setText: state.setText,
  activeView: state.activeView,
  entry: state.entry,
  finalText: state.finalText,
  loading: state.loading,
});

const buildLanguageProps = (languageContext, languageConfig) => ({
  t: languageContext.t,
  dictionarySourceLanguage: languageConfig.dictionarySourceLanguage,
  setDictionarySourceLanguage: languageConfig.setDictionarySourceLanguage,
  dictionaryTargetLanguage: languageConfig.dictionaryTargetLanguage,
  setDictionaryTargetLanguage: languageConfig.setDictionaryTargetLanguage,
  sourceLanguageOptions: languageConfig.sourceLanguageOptions,
  targetLanguageOptions: languageConfig.targetLanguageOptions,
  handleSwapLanguages: languageConfig.handleSwapLanguages,
  lang: languageContext.lang,
  dictionaryFlavor: languageConfig.dictionaryFlavor,
  dictionaryTargetLanguageLabel:
    languageContext.t.dictionaryTargetLanguageLabel,
  dictionarySourceLanguageLabel:
    languageContext.t.dictionarySourceLanguageLabel,
  dictionarySwapLanguagesLabel: languageContext.t.dictionarySwapLanguages,
  chatInputPlaceholder: languageContext.t.inputPlaceholder,
});

const buildControlProps = ({ requests, homeControls }) => ({
  handleSend: requests.handleSend,
  handleShowDictionary: homeControls.handleShowDictionary,
  handleShowLibrary: homeControls.handleShowLibrary,
  handleSelectHistory: requests.handleSelectHistory,
  focusInput: homeControls.focusInput,
});

const buildNotificationProps = ({ popup, toast }) => ({
  popupOpen: popup.popupOpen,
  popupMsg: popup.popupMsg,
  popupConfig: popup.popupConfig,
  closePopup: popup.closePopup,
  toast: toast.state,
  closeToast: toast.closeToast,
});

const buildReportProps = (reporting) => ({
  reportDialog: reporting.reportDialog,
  reportDialogHandlers: reporting.reportDialogHandlers,
});

const buildCopyProps = (copyController) => ({
  canCopyDefinition: copyController.canCopyDefinition,
  handleCopy: copyController.handleCopy,
});

const buildDictionaryViewModel = ({
  state,
  contexts,
  requests,
  copyController,
  homeControls,
  reporting,
  viewState,
  dictionaryActionBarProps,
  displayState,
  searchEmptyState,
  libraryLandingLabel,
}) => {
  const { languageContext, toast, popup, languageConfig } = contexts;
  return {
    ...buildStateProps(state),
    ...buildLanguageProps(languageContext, languageConfig),
    ...buildControlProps({ requests, homeControls }),
    ...buildNotificationProps({ popup, toast }),
    ...buildReportProps(reporting),
    ...buildCopyProps(copyController),
    viewState,
    dictionaryActionBarProps,
    displayClassName: displayState.displayClassName,
    isEmptyStateActive: displayState.isEmptyStateActive,
    libraryLandingLabel,
    searchEmptyState,
  };
};

export function useDictionaryViewModel({ core, requests }) {
  const { state, contexts, copyController, homeControls, reporting, libraryLandingLabel } = core;
  const viewState = resolveViewFlags(state.activeView);
  const dictionaryActionBarProps = useDictionaryActionBarProps({
    state,
    requests,
    copyController,
    reporting,
    languageContext: contexts.languageContext,
  });
  const displayState = resolveDisplayState(state, viewState);
  const searchEmptyState = buildSearchEmptyState(contexts.languageContext.t);
  return buildDictionaryViewModel({
    state,
    contexts,
    requests,
    copyController,
    homeControls,
    reporting,
    viewState,
    dictionaryActionBarProps,
    displayState,
    searchEmptyState,
    libraryLandingLabel,
  });
}
