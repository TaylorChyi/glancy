import { useMemo } from "react";
import { createHistoryStrategy } from "../../history/historyStrategy.js";
import useHistoryDeleteHandler from "./useHistoryDeleteHandler.js";
import useHistoryReoutputHandler from "./useHistoryReoutputHandler.js";
import useHistorySelectHandler from "./useHistorySelectHandler.js";
import useHistorySendHandler from "./useHistorySendHandler.js";

export const useDictionaryHistoryActions = (
  core,
  { loadEntry, hydrateRecord },
) => {
  const {
    state,
    contexts,
    historyCaptureEnabled,
    copyController,
    lookupController,
  } = core;
  const { user } = contexts.userContext;
  const { historyContext, popup, navigate, languageConfig } = contexts;
  const {
    history: historyEntries = [],
    addHistory,
    removeHistory,
  } = historyContext ?? {};
  const {
    dictionaryFlavor,
    dictionarySourceLanguage,
    dictionaryTargetLanguage,
  } = languageConfig;
  const { resetCopyFeedback } = copyController;
  const { cancelActiveLookup } = lookupController;
  const { showPopup } = popup;
  const {
    text,
    setText,
    entry,
    setEntry,
    setFinalText,
    currentTerm,
    setCurrentTerm,
    setCurrentTermKey,
    setActiveView,
    setLoading,
  } = state;

  const historyStrategy = useMemo(
    () => createHistoryStrategy(historyEntries),
    [historyEntries],
  );

  const handleSend = useHistorySendHandler({
    user,
    navigate,
    text,
    setText,
    loadEntry,
    historyCaptureEnabled,
    addHistory,
    dictionaryFlavor,
  });

  const handleReoutput = useHistoryReoutputHandler({ currentTerm, loadEntry });

  const handleSelectHistory = useHistorySelectHandler({
    user,
    navigate,
    historyStrategy,
    dictionarySourceLanguage,
    dictionaryTargetLanguage,
    dictionaryFlavor,
    setActiveView,
    setCurrentTermKey,
    setCurrentTerm,
    resetCopyFeedback,
    cancelActiveLookup,
    hydrateRecord,
    setLoading,
    loadEntry,
  });

  const handleDeleteHistory = useHistoryDeleteHandler({
    entry,
    currentTerm,
    removeHistory,
    user,
    setEntry,
    setFinalText,
    setCurrentTermKey,
    setCurrentTerm,
    resetCopyFeedback,
    showPopup,
  });

  return {
    handleSend,
    handleReoutput,
    handleSelectHistory,
    handleDeleteHistory,
  };
};
