/**
 * 背景：
 *  - 历史记录 Store 长期内聚合了分页、治理、词条缓存等多类逻辑，
 *    在同一文件中交织易导致改动冲突与职责不清。
 * 目的：
 *  - 通过显式的状态机封装业务流程，让 Store 初始器仅负责装配，
 *    以便未来扩展新的策略或接入端口适配器时具备清晰的边界。
 * 关键决策与取舍：
 *  - 采用“状态机 + 模板方法”模式：状态机收敛核心状态，模板方法封装分页加载，
 *    在注入依赖后即可复用，避免在 Hook 中散落网络与持久化细节；
 *  - 拒绝继续堆叠匿名函数，转而以类封装私有方法，减少闭包层级并提高可测试性。
 * 影响范围：
 *  - useHistoryStore 的全部调用方；
 *  - 词条缓存、数据治理与用户登出等侧向依赖在此统一编排。
 * 演进与TODO：
 *  - 后续可将 api 依赖替换为端口接口，引入离线策略或批量操作；
 *  - 如需多租户支持，可扩展上下文以承载租户标识并下沉到策略判定。
 */

import { ApiError } from "@shared/api/client.js";
import {
  HISTORY_PAGE_SIZE,
  HISTORY_PAGINATION_MODES,
  REMOTE_HISTORY_PAGE_LIMIT,
  HistoryRetentionPolicy,
  compareByCreatedAtDesc,
  createTermKey,
  mergeHistory,
  normalizeFlavor,
  normalizeLanguage,
  resolveHistoryItem,
  sanitizeHistoryTerm,
  toHistoryItem,
  type HistoryItem,
  type PaginationMode,
  type SearchRecordDto,
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

type HistoryStateSetter = (
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

export interface HistoryApiGateway {
  fetchPage: (
    params: { token: string; page: number; size: number },
  ) =>
    | Promise<SearchRecordDto[] | { items?: SearchRecordDto[] } | unknown>
    | SearchRecordDto[]
    | { items?: SearchRecordDto[] }
    | unknown;
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

/**
 * 意图：承载历史记录领域的状态机，实现分页加载、治理策略与词条缓存的协作。
 * 输入：上下文包含 setState/getState，依赖注入 API、词条缓存、数据治理与用户能力。
 * 输出：提供给 Store 的初始状态与各项异步动作。
 * 流程：
 *  1) 初始化分页策略映射；
 *  2) 暴露初始状态与方法；
 *  3) 内部以模板方法统一分页请求与异常处理。
 * 错误处理：
 *  - API 异常统一交给 handleApiError，401 时会清理用户并重置状态；
 *  - 其他异常记录日志并保留可诊断的错误消息。
 * 复杂度：
 *  - 分页加载 O(n log n)，排序因合并后重排；
 *  - 其他操作按输入规模线性。
 */
export class HistoryStoreMachine {
  public readonly initialState: HistorySlice = {
    history: [],
    error: null,
    isLoading: false,
    hasMore: false,
    nextPage: 0,
  };

  private readonly paginationReducers: Record<
    PaginationMode,
    (current: HistoryItem[], incoming: HistoryItem[]) => HistoryItem[]
  > = {
    [HISTORY_PAGINATION_MODES.RESET]: (_current, incoming) => incoming,
    [HISTORY_PAGINATION_MODES.APPEND]: (current, incoming) =>
      mergeHistory(current, incoming),
  };

  public constructor(
    private readonly context: HistoryStoreContext,
    private readonly dependencies: HistoryStoreDependencies,
  ) {}

  public loadHistory = async (user?: User | null) => {
    if (user?.token) {
      await this.loadHistoryPage({
        user,
        page: 0,
        mode: HISTORY_PAGINATION_MODES.RESET,
      });
      return;
    }

    this.context.setState({
      history: [],
      error: null,
      hasMore: false,
      isLoading: false,
      nextPage: 0,
    });
  };

  public loadMoreHistory = async (user?: User | null) => {
    if (!user?.token) {
      return;
    }

    const state = this.context.getState();
    if (state.isLoading || !state.hasMore) {
      return;
    }

    await this.loadHistoryPage({
      user,
      page: state.nextPage,
      mode: HISTORY_PAGINATION_MODES.APPEND,
    });
  };

  public addHistory = async (
    term: string,
    user?: User | null,
    language?: string,
    flavor?: string,
  ) => {
    if (!this.dependencies.dataGovernance.isCaptureEnabled()) {
      return;
    }

    const sanitizedTerm = sanitizeHistoryTerm(term) || term;
    const normalizedLanguage = normalizeLanguage(sanitizedTerm, language);
    const normalizedFlavor = normalizeFlavor(flavor);
    const termKey = createTermKey(
      sanitizedTerm,
      normalizedLanguage,
      normalizedFlavor,
    );
    const now = new Date().toISOString();
    const placeholder: HistoryItem = {
      recordId: null,
      term: sanitizedTerm,
      language: normalizedLanguage,
      flavor: normalizedFlavor,
      termKey,
      createdAt: now,
      favorite: false,
      versions: [],
      latestVersionId: null,
    };

    this.context.setState((state) => {
      const filtered = state.history.filter((item) => item.termKey !== termKey);
      const next = [placeholder, ...filtered];
      return {
        history: next,
        nextPage: this.resolveNextPage(next.length),
      };
    });

    if (!user?.token) {
      return;
    }

    try {
      await this.dependencies.api.saveRecord({
        token: user.token,
        term: sanitizedTerm,
        language: normalizedLanguage,
        flavor: normalizedFlavor,
      });
      await this.loadHistoryPage({
        user,
        page: 0,
        mode: HISTORY_PAGINATION_MODES.RESET,
      });
    } catch (error) {
      this.handleApiError(error);
    }
  };

  public clearHistory = async (user?: User | null) => {
    if (user?.token) {
      this.dependencies.api
        .clearRecords({ token: user.token })
        .catch((error) => this.handleApiError(error));
    }

    this.context.setState({
      history: [],
      error: null,
      hasMore: false,
      isLoading: false,
      nextPage: 0,
    });
  };

  public clearHistoryByLanguage = async (
    language: string,
    user?: User | null,
  ) => {
    const normalized = String(language ?? "").trim().toUpperCase();
    if (!normalized) {
      return;
    }

    const wordStore = this.dependencies.wordStore;
    const currentHistory = this.context.getState().history;
    const localCandidates = currentHistory.filter(
      (item) => item.language === normalized,
    );
    if (localCandidates.length > 0) {
      this.context.setState((state) => {
        const filtered = state.history.filter(
          (item) => item.language !== normalized,
        );
        return {
          history: filtered,
          nextPage: this.resolveNextPage(filtered.length),
        };
      });
    }

    const aggregated = new Map<string, HistoryItem>();
    localCandidates.forEach((item) => {
      aggregated.set(item.termKey, item);
    });

    if (user?.token) {
      try {
        const remoteCandidates = await this.collectRemoteHistory(
          user,
          (item) => item.language === normalized,
        );
        remoteCandidates.forEach((item) => {
          aggregated.set(item.termKey, item);
        });
      } catch (error) {
        this.handleApiError(error);
      }
    }

    aggregated.forEach((item) => {
      wordStore.getState().removeVersions(item.termKey);
    });

    this.pruneWordCacheByLanguage(normalized);

    if (!user?.token || aggregated.size === 0) {
      return;
    }

    const recordIds = new Set<string>();
    aggregated.forEach((item) => {
      if (item.recordId) {
        recordIds.add(item.recordId);
      }
    });

    for (const recordId of recordIds.values()) {
      try {
        await this.dependencies.api.deleteRecord({
          recordId,
          token: user.token,
        });
      } catch (error) {
        this.handleApiError(error);
        return;
      }
    }

    try {
      await this.loadHistoryPage({
        user,
        page: 0,
        mode: HISTORY_PAGINATION_MODES.RESET,
      });
    } catch (error) {
      this.handleApiError(error);
    }
  };

  public removeHistory = async (
    identifier: string | HistoryItem,
    user?: User | null,
  ) => {
    const historyItems = this.context.getState().history;
    const target =
      typeof identifier === "object" && identifier
        ? identifier
        : resolveHistoryItem(historyItems, identifier);

    if (!target) {
      this.context.setState((state) => {
        const filtered = state.history.filter(
          (item) => item.termKey !== identifier && item.term !== identifier,
        );
        return {
          history: filtered,
          nextPage: this.resolveNextPage(filtered.length),
        };
      });
      return;
    }

    if (user?.token) {
      const recordId = target.recordId ?? target.latestVersionId;
      if (recordId) {
        try {
          await this.dependencies.api.deleteRecord({
            recordId,
            token: user.token,
          });
        } catch (error) {
          this.handleApiError(error);
        }
      }
    }

    this.context.setState((state) => {
      const filtered = state.history.filter(
        (item) => item.termKey !== target.termKey,
      );
      return {
        history: filtered,
        nextPage: this.resolveNextPage(filtered.length),
      };
    });

    this.dependencies.wordStore.getState().removeVersions(target.termKey);
  };

  public favoriteHistory = async (
    identifier: string,
    user?: User | null,
    versionId?: string,
  ) => {
    if (!user?.token) {
      return;
    }

    const target = resolveHistoryItem(this.context.getState().history, identifier);
    const idToUse =
      versionId ?? target?.recordId ?? target?.latestVersionId ?? null;
    if (!idToUse) {
      return;
    }

    try {
      await this.dependencies.api.favoriteRecord({
        token: user.token,
        recordId: idToUse,
      });
      await this.loadHistoryPage({
        user,
        page: 0,
        mode: HISTORY_PAGINATION_MODES.RESET,
      });
    } catch (error) {
      this.handleApiError(error);
    }
  };

  public unfavoriteHistory = async (
    identifier: string,
    user?: User | null,
    versionId?: string,
  ) => {
    if (!user?.token) {
      return;
    }

    const target = resolveHistoryItem(this.context.getState().history, identifier);
    const idToUse =
      versionId ?? target?.recordId ?? target?.latestVersionId ?? null;
    if (!idToUse) {
      return;
    }

    try {
      await this.dependencies.api.unfavoriteRecord({
        token: user.token,
        recordId: idToUse,
      });
      await this.loadHistoryPage({
        user,
        page: 0,
        mode: HISTORY_PAGINATION_MODES.RESET,
      });
    } catch (error) {
      this.handleApiError(error);
    }
  };

  public applyRetentionPolicy = async (
    retentionDays: number | null,
    user?: User | null,
  ) => {
    const policy = HistoryRetentionPolicy.forDays(retentionDays);
    if (!policy) {
      return;
    }

    const evaluation = policy.evaluate(this.context.getState().history);
    if (evaluation.expired.length === 0) {
      return;
    }

    this.context.setState({
      history: evaluation.retained,
      nextPage: this.resolveNextPage(evaluation.retained.length),
    });

    evaluation.expired.forEach((item) => {
      this.dependencies.wordStore.getState().removeVersions(item.termKey);
    });

    if (!user?.token || evaluation.remoteRecordIds.size === 0) {
      return;
    }

    for (const recordId of evaluation.remoteRecordIds.values()) {
      try {
        await this.dependencies.api.deleteRecord({
          recordId,
          token: user.token,
        });
      } catch (error) {
        this.handleApiError(error);
        return;
      }
    }
  };

  private resolveNextPage(length: number): number {
    if (length <= 0) {
      return 0;
    }
    return Math.ceil(length / HISTORY_PAGE_SIZE);
  }

  private normalizeFetchPayload(
    response: unknown,
  ): SearchRecordDto[] {
    if (Array.isArray(response)) {
      return response;
    }
    if (response && typeof response === "object") {
      const items = (response as { items?: unknown }).items;
      if (Array.isArray(items)) {
        return items as SearchRecordDto[];
      }
    }
    return [];
  }

  private async loadHistoryPage({
    user,
    page,
    mode,
  }: {
    user: User;
    page: number;
    mode: PaginationMode;
  }) {
    const normalizedPage = Math.max(page, 0);
    const reducer = this.paginationReducers[mode];

    this.context.setState(() => ({
      isLoading: true,
      ...(mode === HISTORY_PAGINATION_MODES.RESET
        ? { history: [], error: null, hasMore: true, nextPage: 0 }
        : {}),
    }));

    try {
      const response = await this.dependencies.api.fetchPage({
        token: user.token,
        page: normalizedPage,
        size: HISTORY_PAGE_SIZE,
      });
      const payload = this.normalizeFetchPayload(response);
      const incoming = payload.map(toHistoryItem);
      this.context.setState((state) => {
        const merged = reducer(state.history, incoming);
        const ordered = [...merged].sort(compareByCreatedAtDesc);
        const hasMore = incoming.length === HISTORY_PAGE_SIZE;
        const nextPage = this.resolveNextPage(ordered.length);
        return {
          history: ordered,
          error: null,
          isLoading: false,
          hasMore,
          nextPage,
        };
      });
    } catch (error) {
      this.handleApiError(error);
    }
  }

  private async collectRemoteHistory(
    user: User,
    predicate: (item: HistoryItem) => boolean,
  ): Promise<HistoryItem[]> {
    const matches: HistoryItem[] = [];
    let page = 0;

    for (let visited = 0; visited < REMOTE_HISTORY_PAGE_LIMIT; visited += 1) {
      const response = await this.dependencies.api.fetchPage({
        token: user.token,
        page,
        size: HISTORY_PAGE_SIZE,
      });
      const payload = this.normalizeFetchPayload(response);
      if (payload.length === 0) {
        break;
      }

      const items = payload.map(toHistoryItem);
      items.forEach((item) => {
        if (predicate(item)) {
          matches.push(item);
        }
      });

      if (payload.length < HISTORY_PAGE_SIZE) {
        break;
      }

      page += 1;
    }

    return matches;
  }

  private pruneWordCacheByLanguage(language: string) {
    const normalized = String(language ?? "").trim().toUpperCase();
    if (!normalized) {
      return;
    }

    const prefix = `${normalized}:`;
    this.dependencies.wordStore.setState((state) => {
      const entries = state.entries ?? {};
      const keys = Object.keys(entries);
      if (keys.length === 0) {
        return {};
      }

      let mutated = false;
      const nextEntries: typeof entries = {};
      keys.forEach((termKey) => {
        if (termKey.startsWith(prefix)) {
          mutated = true;
          return;
        }
        nextEntries[termKey] = entries[termKey];
      });

      if (!mutated) {
        return {};
      }

      return { entries: nextEntries };
    });
  }

  private handleApiError(error: unknown) {
    if (error instanceof ApiError && error.status === 401) {
      this.dependencies.user.clearUser();
      const message = error.message?.trim()
        ? error.message
        : "登录状态已失效，请重新登录";
      this.context.setState({
        error: message,
        history: [],
        hasMore: false,
        isLoading: false,
        nextPage: 0,
      });
      return;
    }

    console.error(error);
    const message = error instanceof Error ? error.message : String(error);
    this.context.setState({ error: message, isLoading: false });
  }
}
