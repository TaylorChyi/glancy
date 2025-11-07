import api from "@shared/api/index.js";
import { createPersistentStore } from "./createPersistentStore.js";
import { pickState } from "./persistUtils.js";
import { useWordStore } from "./wordStore.js";
import { useDataGovernanceStore } from "./dataGovernanceStore.js";
import { useUserStore } from "./userStore.js";
import type { HistoryItem } from "@core/history/index.ts";
import {
  createTermKey,
  normalizeFlavor,
  normalizeLanguage,
} from "@core/history/index.ts";
import {
  HistoryStoreMachine,
  type HistoryApiGateway,
  type HistoryState,
} from "./history/historyStoreMachine.ts";

export type { HistoryState } from "./history/historyStoreMachine.ts";

const historyApiGateway: HistoryApiGateway = {
  fetchPage: (params) => api.searchRecords.fetchSearchRecords(params),
  saveRecord: (params) => api.searchRecords.saveSearchRecord(params),
  clearRecords: (params) => api.searchRecords.clearSearchRecords(params),
  deleteRecord: (params) => api.searchRecords.deleteSearchRecord(params),
  favoriteRecord: (params) => api.searchRecords.favoriteSearchRecord(params),
  unfavoriteRecord: (params) =>
    api.searchRecords.unfavoriteSearchRecord(params),
};

export const useHistoryStore = createPersistentStore<HistoryState>({
  key: "searchHistory",
  initializer: (set, get) => {
    const machine = new HistoryStoreMachine(
      {
        setState: (partial, replace) =>
          set(partial as Parameters<typeof set>[0], replace),
        getState: () => get(),
      },
      {
        api: historyApiGateway,
        wordStore: useWordStore,
        dataGovernance: {
          isCaptureEnabled: () =>
            useDataGovernanceStore.getState().historyCaptureEnabled,
        },
        user: {
          clearUser: () => useUserStore.getState().clearUser(),
        },
      },
    );

    return {
      ...machine.initialState,
      loadHistory: machine.loadHistory,
      loadMoreHistory: machine.loadMoreHistory,
      addHistory: machine.addHistory,
      clearHistory: machine.clearHistory,
      clearHistoryByLanguage: machine.clearHistoryByLanguage,
      removeHistory: machine.removeHistory,
      favoriteHistory: machine.favoriteHistory,
      unfavoriteHistory: machine.unfavoriteHistory,
      applyRetentionPolicy: machine.applyRetentionPolicy,
    } satisfies HistoryState;
  },
  persistOptions: {
    partialize: pickState(["history"]),
    version: 3,
    migrate: (persistedState, version) => {
      if (!persistedState) return persistedState;
      let nextState = persistedState;
      if (version === undefined || version < 2) {
        const legacy = Array.isArray(nextState.history)
          ? nextState.history
          : [];
        const upgraded = legacy.map((item) => {
          if (typeof item === "string") {
            const language = normalizeLanguage(item);
            const flavor = normalizeFlavor();
            return {
              term: item,
              language,
              flavor,
              termKey: createTermKey(item, language, flavor),
              createdAt: null,
              favorite: false,
              versions: [],
              latestVersionId: null,
            } satisfies HistoryItem;
          }
          if (item && typeof item === "object") {
            const language = normalizeLanguage(item.term, item.language);
            const flavor = normalizeFlavor(
              "flavor" in item ? item.flavor : undefined,
            );
            return {
              ...item,
              language,
              flavor,
              termKey: createTermKey(item.term, language, flavor),
            } as HistoryItem;
          }
          return item;
        });
        nextState = { ...nextState, history: upgraded };
      }
      if (version !== undefined && version < 3) {
        const upgraded = Array.isArray(nextState.history)
          ? nextState.history.map((item: any) => {
              if (!item || typeof item !== "object") {
                return item;
              }
              const language = normalizeLanguage(item.term, item.language);
              const flavor = normalizeFlavor(item.flavor);
              return {
                ...item,
                language,
                flavor,
                termKey: createTermKey(item.term, language, flavor),
              } as HistoryItem;
            })
          : [];
        nextState = { ...nextState, history: upgraded };
      }
      if (Array.isArray(nextState.history)) {
        const normalized = nextState.history.map((item: any) => {
          if (!item || typeof item !== "object") {
            return item;
          }
          const recordId = item.recordId == null ? null : String(item.recordId);
          return { ...item, recordId } as HistoryItem;
        });
        nextState = { ...nextState, history: normalized };
      }
      return nextState;
    },
  },
});
