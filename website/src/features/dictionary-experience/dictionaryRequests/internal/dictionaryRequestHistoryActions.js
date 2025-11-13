import { useCallback, useMemo } from "react";
import { createHistoryStrategy } from "../../history/historyStrategy.js";
import createDictionaryHistoryDeleteHandler from "./dictionaryHistoryDeleteHandler.js";
import createDictionaryHistorySelectHandler from "./dictionaryHistorySelectHandler.js";
import createDictionaryHistorySendHandler from "./dictionaryHistorySendHandler.js";

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

  const handleSend = useMemo(
    () =>
      createDictionaryHistorySendHandler({
        user,
        navigate,
        text,
        setText,
        loadEntry,
        historyCaptureEnabled,
        addHistory,
        dictionaryFlavor,
      }),
    [
      user,
      navigate,
      text,
      setText,
      loadEntry,
      historyCaptureEnabled,
      addHistory,
      dictionaryFlavor,
    ],
  );

  const handleReoutput = useCallback(() => {
    if (!currentTerm) return;
    loadEntry(currentTerm, { forceNew: true });
  }, [currentTerm, loadEntry]);

  const handleSelectHistory = useMemo(
    () =>
      createDictionaryHistorySelectHandler({
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
      }),
    [
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
    ],
  );

  const handleDeleteHistory = useMemo(
    () =>
      createDictionaryHistoryDeleteHandler({
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
      }),
    [
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
    ],
  );

  return {
    handleSend,
    handleReoutput,
    handleSelectHistory,
    handleDeleteHistory,
  };
};
