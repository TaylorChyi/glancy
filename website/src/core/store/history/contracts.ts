import type {
  HistoryItem,
  PaginationMode,
  SearchRecordDto,
} from "@core/history/index.ts";
import type { WordStoreState } from "../wordStore.js";
import type { User } from "../userStore.js";

export type HistorySlice = {
  history: HistoryItem[];
  error: string | null;
  isLoading: boolean;
  hasMore: boolean;
  nextPage: number;
};

export type HistoryActions = {
  loadHistory: (user?: User | null) => Promise<void>;
  loadMoreHistory: (user?: User | null) => Promise<void>;
  addHistory: (
    term: string,
    user?: User | null,
    language?: string,
    flavor?: string,
  ) => Promise<void>;
  clearHistory: (user?: User | null) => Promise<void>;
  clearHistoryByLanguage: (
    language: string,
    user?: User | null,
  ) => Promise<void>;
  removeHistory: (
    identifier: string | HistoryItem,
    user?: User | null,
  ) => Promise<void>;
  favoriteHistory: (
    identifier: string,
    user?: User | null,
    versionId?: string,
  ) => Promise<void>;
  unfavoriteHistory: (
    identifier: string,
    user?: User | null,
    versionId?: string,
  ) => Promise<void>;
  applyRetentionPolicy: (
    retentionDays: number | null,
    user?: User | null,
  ) => Promise<void>;
};

export type HistoryState = HistorySlice & HistoryActions;

export type HistoryStateSetter = (
  partial:
    | Partial<HistorySlice>
    | ((state: HistorySlice) => Partial<HistorySlice>),
  replace?: boolean,
) => void;

export interface HistoryStoreContext {
  setState: HistoryStateSetter;
  getState: () => HistorySlice & Record<string, unknown>;
}

export type WordStoreAdapter = {
  getState: () => WordStoreState;
  setState: (
    partial:
      | Partial<WordStoreState>
      | ((state: WordStoreState) => Partial<WordStoreState>),
    replace?: boolean,
  ) => void;
};

export type HistoryFetchPayload =
  | SearchRecordDto[]
  | { items?: SearchRecordDto[] }
  | unknown;

export interface HistoryApiGateway {
  fetchPage: (params: {
    token: string;
    page: number;
    size: number;
  }) => Promise<HistoryFetchPayload> | HistoryFetchPayload;
  saveRecord: (params: {
    token: string;
    term: string;
    language: string;
    flavor: string;
  }) => Promise<unknown>;
  clearRecords: (params: { token: string }) => Promise<unknown>;
  deleteRecord: (params: {
    token: string;
    recordId: string;
  }) => Promise<unknown>;
  favoriteRecord: (params: {
    token: string;
    recordId: string;
  }) => Promise<unknown>;
  unfavoriteRecord: (params: {
    token: string;
    recordId: string;
  }) => Promise<unknown>;
}

export interface HistoryStoreDependencies {
  api: HistoryApiGateway;
  wordStore: WordStoreAdapter;
  dataGovernance: {
    isCaptureEnabled: () => boolean;
  };
  user: {
    clearUser: () => void;
  };
}

export type LoadHistoryPageParams = {
  user: User;
  page: number;
  mode: PaginationMode;
};

export const INITIAL_HISTORY_SLICE: HistorySlice = {
  history: [],
  error: null,
  isLoading: false,
  hasMore: false,
  nextPage: 0,
};
