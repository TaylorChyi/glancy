import { jest } from "@jest/globals";
import { useHistoryStore } from "@core/store/historyStore.ts";

const captureHistorySnapshot = () => {
  const state = useHistoryStore.getState();
  return {
    ...state,
    history: [...state.history],
  };
};

export const createHistoryRecord = (overrides = {}) => ({
  term: "hello",
  language: "ENGLISH",
  flavor: "BILINGUAL",
  termKey: "ENGLISH:BILINGUAL:hello",
  createdAt: "2024-05-01T10:00:00Z",
  favorite: false,
  versions: [
    {
      id: "v1",
      createdAt: "2024-05-01T10:00:00Z",
      favorite: false,
    },
  ],
  latestVersionId: "v1",
  ...overrides,
});

export const installHistoryStoreMocks = (overrides = {}) => {
  const snapshot = captureHistorySnapshot();
  const clearHistory = overrides.clearHistory ?? jest.fn().mockResolvedValue(undefined);
  const clearHistoryByLanguage =
    overrides.clearHistoryByLanguage ?? jest.fn().mockResolvedValue(undefined);
  const applyRetentionPolicy =
    overrides.applyRetentionPolicy ?? jest.fn().mockResolvedValue(undefined);

  useHistoryStore.setState(
    {
      ...snapshot,
      history: overrides.history ?? snapshot.history ?? [],
      clearHistory,
      clearHistoryByLanguage,
      applyRetentionPolicy,
      ...overrides,
    },
    true,
  );

  const setHistory = (history) => useHistoryStore.setState({ history });

  return {
    clearHistory,
    clearHistoryByLanguage,
    applyRetentionPolicy,
    setHistory,
    getState: () => useHistoryStore.getState(),
    restore: () => useHistoryStore.setState(snapshot, true),
  };
};
