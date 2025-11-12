import { jest } from "@jest/globals";
import api from "@shared/api/index.js";
import { useHistoryStore } from "@core/store/historyStore.ts";
import { useWordStore } from "@core/store/wordStore.js";
import { useDataGovernanceStore } from "@core/store/dataGovernanceStore.ts";
import { useUserStore } from "@core/store/userStore.js";
import { WORD_FLAVOR_BILINGUAL } from "@shared/utils/language.js";

export const mockWordStore = useWordStore;
export const historyStore = useHistoryStore;
export const dataGovernanceStore = useDataGovernanceStore;
export const userStore = useUserStore;
export const mockApi = api;

mockApi.searchRecords = {
  fetchSearchRecords: jest.fn().mockResolvedValue([]),
  saveSearchRecord: jest.fn().mockResolvedValue({
    id: "rec-1",
    term: "test",
    language: "ENGLISH",
    flavor: WORD_FLAVOR_BILINGUAL,
    createdAt: "2024-05-01T10:00:00Z",
    favorite: false,
    versions: [
      {
        id: "ver-1",
        createdAt: "2024-05-01T10:00:00Z",
        favorite: false,
      },
    ],
  }),
  clearSearchRecords: jest.fn().mockResolvedValue(undefined),
  deleteSearchRecord: jest.fn().mockResolvedValue(undefined),
  favoriteSearchRecord: jest.fn().mockResolvedValue(undefined),
  unfavoriteSearchRecord: jest.fn().mockResolvedValue(undefined),
};

export const historyTestUser = { id: "u1", token: "t" };

export const makeRecord = (idx) => {
  const createdAt = new Date(
    Date.UTC(2024, 0, idx + 1, 10, 0, 0),
  ).toISOString();
  return {
    id: `rec-${idx}`,
    term: `term-${idx}`,
    language: "ENGLISH",
    flavor: WORD_FLAVOR_BILINGUAL,
    createdAt,
    favorite: false,
    versions: [
      {
        id: `ver-${idx}`,
        createdAt,
        favorite: false,
      },
    ],
  };
};

export const resetHistoryTestState = () => {
  localStorage.clear();
  jest.clearAllMocks();
  historyStore.setState({
    history: [],
    error: null,
    isLoading: false,
    hasMore: false,
    nextPage: 0,
  });
  mockWordStore.setState({ entries: {} });
  dataGovernanceStore.setState({
    retentionPolicyId: "90d",
    historyCaptureEnabled: true,
  });
  userStore.setState({ user: null });
};
