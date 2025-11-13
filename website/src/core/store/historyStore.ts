import api from "@shared/api/index.js";
import { createPersistentStore } from "./createPersistentStore.js";
import { pickState } from "./persistUtils.js";
import { useWordStore } from "./wordStore.js";
import { useDataGovernanceStore } from "./dataGovernanceStore.js";
import { useUserStore } from "./userStore.js";
import {
  type HistoryApiGateway,
  type HistoryState,
  type HistoryStoreDependencies,
} from "./history/historyStoreMachine.ts";
import { createHistoryStoreInitializer } from "./history/initializers/createHistoryStoreInitializer.ts";
import { migrateHistoryState } from "./history/migrations/historyStoreMigrations.ts";

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

const historyStoreDependencies: HistoryStoreDependencies = {
  api: historyApiGateway,
  wordStore: useWordStore,
  dataGovernance: {
    isCaptureEnabled: () =>
      useDataGovernanceStore.getState().historyCaptureEnabled,
  },
  user: {
    clearUser: () => useUserStore.getState().clearUser(),
  },
};

export const useHistoryStore = createPersistentStore<HistoryState>({
  key: "searchHistory",
  initializer: createHistoryStoreInitializer(historyStoreDependencies),
  persistOptions: {
    partialize: pickState(["history"]),
    version: 3,
    migrate: migrateHistoryState,
  },
});
