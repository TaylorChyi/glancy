import { useEffect } from "react";

export function useDictionaryExperienceLifecycle({
  user,
  loadHistory,
  state,
  applyRecord,
  wordStoreApi,
  wordEntries,
  resetDictionaryHomeState,
  closeReportDialog,
}) {
  useEffect(() => {
    loadHistory(user);
  }, [user, loadHistory]);

  useEffect(() => {
    if (!state.currentTermKey) return;
    const record = wordStoreApi.getState().getRecord?.(state.currentTermKey);
    if (record) {
      applyRecord(state.currentTermKey, record, record.activeVersionId);
    }
  }, [wordEntries, state.currentTermKey, applyRecord, wordStoreApi]);

  useEffect(() => {
    if (!user) {
      resetDictionaryHomeState();
      state.setText("");
      closeReportDialog();
    }
  }, [user, resetDictionaryHomeState, closeReportDialog, state]);
}
