/**
 * 背景：
 *  - 历史状态机原先在单一文件中同时定义类型、常量与具体实现，
 *    造成上下游在维护合同时需要翻阅整份大文件，难以定位边界。
 * 目的：
 *  - 将对外暴露的类型与常量拆分为独立契约模块，
 *    以支持状态机、分页协调器等实现按需组合且避免循环依赖。
 * 关键决策与取舍：
 *  - 采用明确的接口定义（端口-适配器思想）描述 API、上下文、依赖，
 *    比起直接导出实现细节可提升替换实现时的可扩展性；
 *  - 保留与 zustand Store 的轻量耦合（getState/setState），
 *    以兼容既有装配逻辑并避免一次性重写。
 * 影响范围：
 *  - HistoryStoreMachine 及其周边协作者；
 *  - 依赖 HistoryState、HistoryActions 等类型的调用方。
 * 演进与TODO：
 *  - 如引入多端同步，可在此补充新的端口定义（例如订阅事件流）。
 */

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
  clearHistoryByLanguage: (language: string, user?: User | null) => Promise<void>;
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
  deleteRecord: (params: { token: string; recordId: string }) => Promise<unknown>;
  favoriteRecord: (params: { token: string; recordId: string }) => Promise<unknown>;
  unfavoriteRecord: (params: { token: string; recordId: string }) => Promise<unknown>;
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
