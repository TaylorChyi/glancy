import {
  useFavoritesStore,
  useHistoryStore,
  useVoiceStore,
  useWordStore,
} from "@/store";

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
