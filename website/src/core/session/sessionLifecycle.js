import { useHistoryStore } from "@core/store/historyStore.ts";
import { useVoiceStore } from "@core/store/voiceStore.ts";
import { useWordStore } from "@core/store/wordStore.js";

function clearHistoryState() {
  const historyStore = useHistoryStore.getState();
  if (historyStore?.clearHistory) {
    historyStore.clearHistory();
  }
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
