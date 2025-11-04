/**
 * 背景：
 *  - useDictionaryExperience 中的副作用监听分散存在，影响可读性。
 * 目的：
 *  - 将副作用统一收敛，确保状态初始化与回收逻辑集中管理。
 * 关键决策与取舍：
 *  - 仅处理副作用，不返回值；
 *  - 依赖项通过参数显式传递，便于测试与复用。
 */
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
    if (state.loading) return;

    const record = wordStoreApi.getState().getRecord?.(state.currentTermKey);
    if (record) {
      applyRecord(state.currentTermKey, record, record.activeVersionId);
    }
  }, [
    wordEntries,
    state.currentTermKey,
    state.loading,
    applyRecord,
    wordStoreApi,
  ]);

  useEffect(() => {
    if (!user) {
      resetDictionaryHomeState();
      state.setText("");
      closeReportDialog();
    }
  }, [user, resetDictionaryHomeState, closeReportDialog, state]);
}
