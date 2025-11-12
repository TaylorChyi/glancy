import { useEffect } from "react";

export function useDictionaryExperienceLifecycle({
  user,
  loadHistory,
  state,
  wordStoreApi,
  wordEntries,
  resetDictionaryHomeState,
  closeReportDialog,
  hydrateRecord,
}) {
  useEffect(() => {
    loadHistory(user);
  }, [user, loadHistory]);

  useEffect(() => {
    if (!state.currentTermKey) return;
    const record = wordStoreApi.getState().getRecord?.(state.currentTermKey);
    if (record) {
      hydrateRecord(state.currentTermKey, record.activeVersionId);
    }
  }, [wordEntries, state.currentTermKey, hydrateRecord, wordStoreApi]);

  useEffect(() => {
    if (!user) {
      resetDictionaryHomeState();
      state.setText("");
      closeReportDialog();
    }
  }, [user, resetDictionaryHomeState, closeReportDialog, state]);
}
