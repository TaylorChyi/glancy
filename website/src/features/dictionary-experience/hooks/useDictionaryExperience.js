import { useStreamWord, useSpeechInput } from "@shared/hooks";
import { useWordStore } from "@core/store/wordStore.js";
import { useDataGovernanceStore } from "@core/store/dataGovernanceStore.ts";
import { useDictionaryLookupController } from "./useDictionaryLookupController.ts";
import { isDictionaryView, isHistoryView } from "../dictionaryExperienceViews.js";
import { useDictionaryExperienceState } from "./useDictionaryExperienceState.js";
import { useDictionaryExperienceContext } from "./useDictionaryExperienceContext.js";
import { useDictionaryReportDialogManager } from "./useDictionaryReportDialogManager.js";
import { createDictionaryExperienceViewModel } from "./createDictionaryExperienceViewModel.js";
import { useDictionaryExperienceInteractions } from "./useDictionaryExperienceInteractions.js";
import { useDictionaryExperienceLifecycle } from "./useDictionaryExperienceLifecycle.js";

export { COPY_FEEDBACK_STATES } from "./useDictionaryCopyController.js";

export function useDictionaryExperience() {
  const state = useDictionaryExperienceState();
  const contexts = useDictionaryExperienceContext();

  const { languageContext, userContext } = contexts;
  const { historyContext, popup, toast, languageConfig } = contexts;

  const { t, lang } = languageContext;
  const { user } = userContext;
  const { loadHistory } = historyContext;
  const { popupOpen, popupMsg, popupConfig, showPopup, closePopup } = popup;
  const { state: toastState, showToast, closeToast } = toast;
  const {
    dictionarySourceLanguage,
    dictionaryTargetLanguage,
    setDictionarySourceLanguage,
    setDictionaryTargetLanguage,
    sourceLanguageOptions,
    targetLanguageOptions,
    dictionaryFlavor,
    handleSwapLanguages,
  } = languageConfig;

  const wordEntries = useWordStore((store) => store.entries);
  const wordStoreApi = useWordStore;
  const historyCaptureEnabled = useDataGovernanceStore(
    (settings) => settings.historyCaptureEnabled,
  );
  const { beginLookup, cancelActiveLookup, clearActiveLookup, isMounted } =
    useDictionaryLookupController();
  const streamWord = useStreamWord();
  const { start: startSpeech } = useSpeechInput({ onResult: state.setText });

  const interactions = useDictionaryExperienceInteractions({
    state,
    contexts,
    wordStoreApi,
    historyCaptureEnabled,
    lookupController: {
      beginLookup,
      cancelActiveLookup,
      clearActiveLookup,
      isMounted,
    },
    streamWord,
    startSpeech,
  });

  const {
    activeTerm,
    canCopyDefinition,
    copyFeedbackState,
    handleCopy,
    isCopySuccessActive,
    handleSend,
    handleReoutput,
    handleSelectHistory,
    handleDeleteHistory,
    focusInput,
    resetDictionaryHomeState,
    handleShowDictionary,
    handleVoice,
    handleNavigateVersion,
    applyRecord,
  } = interactions;

  const isDictionaryViewActive = isDictionaryView(state.activeView);
  const isHistoryViewActive = isHistoryView(state.activeView);

  const {
    reportDialog,
    reportDialogHandlers,
    handleReport,
    closeReportDialog,
  } = useDictionaryReportDialogManager({
    t,
    showToast,
    showPopup,
    dictionarySourceLanguage,
    dictionaryTargetLanguage,
    dictionaryFlavor,
    entry: state.entry,
    activeTerm,
  });

  useDictionaryExperienceLifecycle({
    user,
    loadHistory,
    state,
    applyRecord,
    wordStoreApi,
    wordEntries,
    resetDictionaryHomeState,
    closeReportDialog,
  });

  const isEntryViewActive = isDictionaryViewActive;
  const isTermActionable = isEntryViewActive && Boolean(activeTerm);

  return createDictionaryExperienceViewModel({
    inputRef: state.inputRef,
    t,
    text: state.text,
    setText: state.setText,
    dictionarySourceLanguage,
    setDictionarySourceLanguage,
    dictionaryTargetLanguage,
    setDictionaryTargetLanguage,
    sourceLanguageOptions,
    targetLanguageOptions,
    handleSwapLanguages,
    handleSend,
    handleVoice,
    handleShowDictionary,
    handleSelectHistory,
    activeView: state.activeView,
    isDictionaryViewActive,
    isHistoryViewActive,
    focusInput,
    entry: state.entry,
    finalText: state.finalText,
    streamText: state.streamText,
    loading: state.loading,
    activeTerm,
    lang,
    handleReoutput,
    isTermActionable,
    isEntryViewActive,
    versions: state.versions,
    activeVersionId: state.activeVersionId,
    handleNavigateVersion,
    handleCopy,
    canCopyDefinition,
    copyFeedbackState,
    isCopySuccessActive,
    handleDeleteHistory,
    handleReport,
    popupOpen,
    popupMsg,
    popupConfig,
    closePopup,
    toastState,
    closeToast,
    reportDialog,
    reportDialogHandlers,
    dictionaryFlavor,
  });
}
