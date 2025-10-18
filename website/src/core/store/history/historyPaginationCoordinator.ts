/**
 * 背景：
 *  - 历史状态机既负责分页又处理增删，单个类体量高达数百行，
 *    难以聚焦分页策略本身的演进。
 * 目的：
 *  - 引入“分页协调器”（Pagination Coordinator）作为独立角色，
 *    负责对接远端分页接口并维护分页元数据，
 *    使状态机可以专注于业务意图编排。
 * 关键决策与取舍：
 *  - 采用模板方法封装加载流程（loadPage），避免重复的 try/catch 与排序逻辑；
 *  - 公布最小必要的协作接口（resolveNextPage/refreshFirstPage/collectRemoteMatches），
 *    便于其他策略（例如清理、收藏）按需重用。
 * 影响范围：
 *  - loadHistory / loadMoreHistory 等分页入口；
 *  - 依赖远端遍历的清理策略（按语言批量删除等）。
 * 演进与TODO：
 *  - 可进一步引入缓存层或乐观更新策略，通过扩展 loadPage 内的 reducer 实现。
 */

import {
  HISTORY_PAGE_SIZE,
  HISTORY_PAGINATION_MODES,
  REMOTE_HISTORY_PAGE_LIMIT,
  compareByCreatedAtDesc,
  mergeHistory,
  toHistoryItem,
  type HistoryItem,
  type PaginationMode,
  type SearchRecordDto,
} from "@core/history/index.ts";
import type { User } from "../userStore.ts";
import type {
  HistoryStoreContext,
  HistoryStoreDependencies,
  LoadHistoryPageParams,
  HistoryFetchPayload,
} from "./contracts.ts";
import { HistoryErrorBoundary } from "./historyErrorBoundary.ts";

export class HistoryPaginationCoordinator {
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
    private readonly errorBoundary: HistoryErrorBoundary,
  ) {}

  /**
   * 意图：加载首屏历史数据，当用户未登录时重置到初始状态。
   */
  public loadInitial = async (user?: User | null) => {
    if (user?.token) {
      await this.loadPage({
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

  /**
   * 意图：基于当前分页元数据拉取下一页记录。
   */
  public loadMore = async (user?: User | null) => {
    if (!user?.token) {
      return;
    }

    const state = this.context.getState();
    if (state.isLoading || !state.hasMore) {
      return;
    }

    await this.loadPage({
      user,
      page: state.nextPage,
      mode: HISTORY_PAGINATION_MODES.APPEND,
    });
  };

  /**
   * 意图：根据当前历史长度推导下一页索引。
   */
  public resolveNextPage(length: number): number {
    if (length <= 0) {
      return 0;
    }
    return Math.ceil(length / HISTORY_PAGE_SIZE);
  }

  /**
   * 意图：刷新首屏历史，供增删收藏等场景复用。
   */
  public refreshFirstPage = async (user: User) => {
    await this.loadPage({
      user,
      page: 0,
      mode: HISTORY_PAGINATION_MODES.RESET,
    });
  };

  /**
   * 意图：跨页遍历远端历史并筛选出满足条件的记录。
   * 复杂度：O(n) ~ 以页大小为单位线性扫描，受限于 REMOTE_HISTORY_PAGE_LIMIT。
   */
  public async collectRemoteMatches(
    user: User,
    predicate: (item: HistoryItem) => boolean,
  ): Promise<HistoryItem[]> {
    const matches: HistoryItem[] = [];
    let page = 0;

    for (let visited = 0; visited < REMOTE_HISTORY_PAGE_LIMIT; visited += 1) {
      try {
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
      } catch (error) {
        this.errorBoundary.capture(error);
        break;
      }
    }

    return matches;
  }

  private async loadPage({ user, page, mode }: LoadHistoryPageParams) {
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
      this.errorBoundary.capture(error);
    }
  }

  private normalizeFetchPayload(response: HistoryFetchPayload): SearchRecordDto[] {
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
}
