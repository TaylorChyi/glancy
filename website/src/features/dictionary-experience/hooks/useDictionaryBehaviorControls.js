import { useDictionaryCopyController } from "./useDictionaryCopyController.js";
import { useDictionaryLookupExecutor } from "./useDictionaryLookupExecutor.js";
import { useDictionaryHistoryHandlers } from "./useDictionaryHistoryHandlers.js";
import { useDictionaryRecordHydrator } from "./useDictionaryRecordHydrator.js";

export function useDictionaryBehaviorControls({
  state,
  contexts,
  wordStoreApi,
  historyCaptureEnabled,
  lookupController,
  streamWord,
  fetchWord,
}) {
  const {
    entry,
    setEntry,
    finalText,
    setFinalText,
    streamText,
    setStreamText,
    currentTermKey,
    setCurrentTermKey,
    currentTerm,
    setCurrentTerm,
    setLoading,
    setActiveView,
    text,
    setText,
  } = state;

  const {
    languageContext,
    userContext,
    historyContext,
    popup,
    languageConfig,
  } = contexts;

  const { t } = languageContext;
  const { user } = userContext;
  const { history: historyItems, addHistory, removeHistory } = historyContext;
  const { showPopup } = popup;
  const {
    dictionarySourceLanguage,
    dictionaryTargetLanguage,
    dictionaryFlavor,
  } = languageConfig;
  const { beginLookup, cancelActiveLookup, clearActiveLookup, isMounted } =
    lookupController;

  const activeTerm = entry?.term || currentTerm;
  const applyRecord = useDictionaryRecordHydrator({
    wordStoreApi,
    setEntry,
    setFinalText,
    setStreamText,
    setCurrentTerm,
  });

  const {
    canCopyDefinition,
    copyFeedbackState,
    handleCopy,
    isCopySuccessActive,
    resetCopyFeedback,
  } = useDictionaryCopyController({
    entry,
    finalText,
    streamText,
    currentTerm,
    t,
    showPopup,
  });

  const { executeLookup } = useDictionaryLookupExecutor({
    streamWord,
    user,
    beginLookup,
    clearActiveLookup,
    isMounted,
    setActiveView,
    setLoading,
    setEntry,
    setStreamText,
    setFinalText,
    dictionarySourceLanguage,
    dictionaryTargetLanguage,
    currentTermKey,
    setCurrentTermKey,
    setCurrentTerm,
    wordStoreApi,
    applyRecord,
    resetCopyFeedback,
    showPopup,
  });

  const historyHandlers = useDictionaryHistoryHandlers({
    user,
    navigate: contexts.navigate,
    text,
    setText,
    historyItems,
    dictionarySourceLanguage,
    dictionaryTargetLanguage,
    dictionaryFlavor,
    executeLookup,
    fetchWord,
    historyCaptureEnabled,
    addHistory,
    removeHistory,
    setEntry,
    setFinalText,
    setStreamText,
    setCurrentTermKey,
    setCurrentTerm,
    setActiveView,
    setLoading,
    wordStoreApi,
    applyRecord,
    cancelActiveLookup,
    resetCopyFeedback,
    currentTerm,
    activeTerm,
    showPopup,
  });

  return {
    activeTerm,
    canCopyDefinition,
    copyFeedbackState,
    handleCopy,
    isCopySuccessActive,
    resetCopyFeedback,
    applyRecord,
    ...historyHandlers,
  };
}
