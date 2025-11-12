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

  const historyStrategy = useMemo(
    () => createHistoryStrategy(historyContext.history ?? []),
    [historyContext.history],
  );

  const handleSend = useCallback(
    async (event) => {
      event.preventDefault();
      if (!user) {
        navigate("/login");
        return;
      }
      if (!sanitizeTerm(state.text)) return;
      const inputValue = sanitizeTerm(state.text);
      state.setText("");
      const result = await loadEntry(inputValue);
      if (result.status !== "success" || !historyCaptureEnabled) {
        return;
      }
      const historyTerm = result.term ?? result.queriedTerm ?? inputValue;
      historyContext.addHistory(
        historyTerm,
        user,
        result.detectedLanguage,
        result.flavor ?? languageConfig.dictionaryFlavor,
      );
    },
    [
      user,
      navigate,
      state,
      loadEntry,
      historyCaptureEnabled,
      historyContext,
      languageConfig.dictionaryFlavor,
    ],
  );

  const handleReoutput = useCallback(() => {
    if (!state.currentTerm) return;
    loadEntry(state.currentTerm, { forceNew: true });
  }, [state.currentTerm, loadEntry]);

  const handleSelectHistory = useCallback(
    async (identifier, versionId) => {
      if (!user) {
        navigate("/login");
        return;
      }

      const selection = resolveHistorySelection({
        strategy: historyStrategy,
        identifier,
        dictionarySourceLanguage: languageConfig.dictionarySourceLanguage,
        dictionaryTargetLanguage: languageConfig.dictionaryTargetLanguage,
        dictionaryFlavor: languageConfig.dictionaryFlavor,
      });

      if (!selection) return;

      state.setActiveView(DICTIONARY_EXPERIENCE_VIEWS.DICTIONARY);
      state.setCurrentTermKey(selection.cacheKey);
      state.setCurrentTerm(selection.term);
      copyController.resetCopyFeedback();
      lookupController.cancelActiveLookup();

      const hydrated = hydrateRecord(
        selection.cacheKey,
        versionId ?? selection.versionId,
      );
      if (hydrated) {
        state.setLoading(false);
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
      languageConfig,
      state,
      copyController,
      lookupController,
      hydrateRecord,
      loadEntry,
    ],
  );

  const handleDeleteHistory = useCallback(async () => {
    const activeTerm = state.entry?.term || state.currentTerm;
    if (!activeTerm) return;
    try {
      await historyContext.removeHistory(activeTerm, user);
      state.setEntry(null);
      state.setFinalText("");
      state.setCurrentTermKey(null);
      state.setCurrentTerm("");
      copyController.resetCopyFeedback();
    } catch (error) {
      console.error("[DictionaryExperience] remove history failed", error);
      popup.showPopup(error.message ?? String(error));
    }
  }, [
    state.entry,
    state.currentTerm,
    historyContext,
    user,
    state,
    copyController,
    popup,
  ]);

  return {
    handleSend,
    handleReoutput,
    handleSelectHistory,
    handleDeleteHistory,
  };
};
