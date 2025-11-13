import { useCallback, useMemo } from "react";
import { DICTIONARY_EXPERIENCE_VIEWS } from "../../dictionaryExperienceViews.js";
import { createHistoryStrategy } from "../../history/historyStrategy.js";
import {
  resolveHistorySelection,
  sanitizeTerm,
} from "./dictionaryRequestHelpers.js";

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

  const handleSend = useCallback(
    async (event) => {
      event.preventDefault();
      if (!user) {
        navigate("/login");
        return;
      }
      const inputValue = sanitizeTerm(text);
      if (!inputValue) return;
      setText("");
      const result = await loadEntry(inputValue);
      if (result.status !== "success" || !historyCaptureEnabled) {
        return;
      }
      const historyTerm = result.term ?? result.queriedTerm ?? inputValue;
      addHistory(
        historyTerm,
        user,
        result.detectedLanguage,
        result.flavor ?? dictionaryFlavor,
      );
    },
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

  const handleSelectHistory = useCallback(
    async (identifier, versionId) => {
      if (!user) {
        navigate("/login");
        return;
      }

      const selection = resolveHistorySelection({
        strategy: historyStrategy,
        identifier,
        dictionarySourceLanguage,
        dictionaryTargetLanguage,
        dictionaryFlavor,
      });

      if (!selection) return;

      setActiveView(DICTIONARY_EXPERIENCE_VIEWS.DICTIONARY);
      setCurrentTermKey(selection.cacheKey);
      setCurrentTerm(selection.term);
      resetCopyFeedback();
      cancelActiveLookup();

      const hydrated = hydrateRecord(
        selection.cacheKey,
        versionId ?? selection.versionId,
      );
      if (hydrated) {
        setLoading(false);
        return;
      }

      await loadEntry(selection.term, {
        language: selection.language,
        flavor: selection.flavor,
        versionId: versionId ?? selection.versionId,
      });
    },
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

  const handleDeleteHistory = useCallback(async () => {
    const activeTerm = entry?.term || currentTerm;
    if (!activeTerm) return;
    try {
      await removeHistory(activeTerm, user);
      setEntry(null);
      setFinalText("");
      setCurrentTermKey(null);
      setCurrentTerm("");
      resetCopyFeedback();
    } catch (error) {
      console.error("[DictionaryExperience] remove history failed", error);
      showPopup(error.message ?? String(error));
    }
  }, [
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
  ]);

  return {
    handleSend,
    handleReoutput,
    handleSelectHistory,
    handleDeleteHistory,
  };
};
