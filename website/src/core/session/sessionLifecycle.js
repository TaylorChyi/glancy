// 为避免桶状导出导致的循环依赖，在会话生命周期模块中直接依赖各 store。
import { useFavoritesStore } from "@core/store/favoritesStore.ts";
import { useHistoryStore } from "@core/store/historyStore.ts";
import { useVoiceStore } from "@core/store/voiceStore.ts";
import { useWordStore } from "@core/store/wordStore.js";

function clearHistoryState() {
  const historyStore = useHistoryStore.getState();
  if (historyStore?.clearHistory) {
    historyStore.clearHistory();
  }
}

function clearFavoritesState() {
  useFavoritesStore.setState({ favorites: [] });
}

function clearWordCache() {
  const wordStore = useWordStore.getState();
  wordStore?.clear?.();
}

function clearVoicePreferences() {
  useVoiceStore.setState({ voices: {} });
}

export function resetClientSessionState() {
  clearHistoryState();
  clearFavoritesState();
  clearWordCache();
  clearVoicePreferences();
}

export async function hydrateClientSessionState(user) {
  if (!user?.token) return;

  const historyStore = useHistoryStore.getState();
  if (historyStore?.loadHistory) {
    await historyStore.loadHistory(user);
  }
}
