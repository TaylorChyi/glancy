import { useMemo } from "react";
import { createHistoryStrategy } from "../../history/historyStrategy.js";
import useHistoryDeleteHandler from "./useHistoryDeleteHandler.js";
import useHistoryReoutputHandler from "./useHistoryReoutputHandler.js";
import useHistorySelectHandler from "./useHistorySelectHandler.js";
import useHistorySendHandler from "./useHistorySendHandler.js";

const useDictionaryHistorySendAction = (core, loadEntry) => {
  const { contexts, state, historyCaptureEnabled } = core;
  const { user } = contexts.userContext;
  const { addHistory } = contexts.historyContext ?? {};
  return useHistorySendHandler({
    user,
    navigate: contexts.navigate,
    text: state.text,
    setText: state.setText,
    loadEntry,
    historyCaptureEnabled,
    addHistory,
    dictionaryFlavor: contexts.languageConfig.dictionaryFlavor,
  });
};

const useDictionaryHistorySelectAction = (
  core,
  { loadEntry, hydrateRecord },
  historyStrategy,
) => {
  const { contexts, state, lookupController } = core;
  const { user } = contexts.userContext;
  const { dictionarySourceLanguage, dictionaryTargetLanguage, dictionaryFlavor } =
    contexts.languageConfig;
  const navigate = contexts.navigate;
  const { setActiveView, setCurrentTermKey, setCurrentTerm, setLoading } = state;
  const resetCopyFeedback = core.copyController.resetCopyFeedback;
  const cancelActiveLookup = lookupController.cancelActiveLookup;
  return useHistorySelectHandler({
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
};

const useDictionaryHistoryDeleteAction = (core) => {
  const { state, contexts, copyController } = core;
  const { historyContext, popup, userContext } = contexts;
  const { removeHistory } = historyContext ?? {};
  const handlerParams = useMemo(
    () => ({
      entry: state.entry,
      currentTerm: state.currentTerm,
      removeHistory,
      user: userContext.user,
      setEntry: state.setEntry,
      setFinalText: state.setFinalText,
      setCurrentTermKey: state.setCurrentTermKey,
      setCurrentTerm: state.setCurrentTerm,
      resetCopyFeedback: copyController.resetCopyFeedback,
      showPopup: popup.showPopup,
    }),
    [
      state.entry, state.currentTerm, removeHistory, userContext.user,
      state.setEntry, state.setFinalText, state.setCurrentTermKey,
      state.setCurrentTerm, copyController.resetCopyFeedback, popup.showPopup,
    ],
  );
  return useHistoryDeleteHandler(handlerParams);
};

export const useDictionaryHistoryActions = (
  core,
  { loadEntry, hydrateRecord },
) => {
  const historyEntries = core.contexts.historyContext?.history;
  const historyStrategy = useMemo(
    () => createHistoryStrategy(historyEntries ?? []),
    [historyEntries],
  );

  const handleSend = useDictionaryHistorySendAction(core, loadEntry);
  const handleReoutput = useHistoryReoutputHandler({
    currentTerm: core.state.currentTerm,
    loadEntry,
  });
  const handleSelectHistory = useDictionaryHistorySelectAction(
    core,
    { loadEntry, hydrateRecord },
    historyStrategy,
  );
  const handleDeleteHistory = useDictionaryHistoryDeleteAction(core);

  return {
    handleSend,
    handleReoutput,
    handleSelectHistory,
    handleDeleteHistory,
  };
};
