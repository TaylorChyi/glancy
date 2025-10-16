import api from "@shared/api/index.js";
import { ApiError } from "@shared/api/client.js";
import { useWordStore } from "./wordStore.js";
import { useDataGovernanceStore } from "./dataGovernanceStore.js";
import { createPersistentStore } from "./createPersistentStore.js";
import { pickState } from "./persistUtils.js";
import { useUserStore } from "./userStore.js";
import type { User } from "./userStore.js";
import {
  HISTORY_PAGE_SIZE,
  HISTORY_PAGINATION_MODES,
  REMOTE_HISTORY_PAGE_LIMIT,
  type PaginationMode,
  type HistoryItem,
  type SearchRecordDto,
  HistoryRetentionPolicy,
  compareByCreatedAtDesc,
  createTermKey,
  mergeHistory,
  normalizeFlavor,
  normalizeLanguage,
  resolveHistoryItem,
  sanitizeHistoryTerm,
  toHistoryItem,
} from "@core/history/index.ts";

interface HistoryState {
  history: HistoryItem[];
  error: string | null;
  isLoading: boolean;
  hasMore: boolean;
  nextPage: number;
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
}

type SetState = (
  partial:
    | Partial<HistoryState>
    | ((state: HistoryState) => Partial<HistoryState>),
  replace?: boolean,
) => void;

/**
 * 意图：使用模板方法遍历服务端分页历史，收集满足谓词的记录。
 * 输入：用户凭证 user、过滤函数 predicate。
 * 输出：匹配的历史项集合；若接口异常则抛出错误交由调用方处理。
 * 流程：
 *  1) 逐页请求搜索历史，每页大小沿用 HISTORY_PAGE_SIZE；
 *  2) 将响应映射为 HistoryItem 并根据 predicate 过滤；
 *  3) 达到上限页数或最后一页时终止循环。
 * 错误处理：透传请求异常，由上层统一交由 handleApiError 处理。
 * 复杂度：最坏 O(P)，P 为遍历的页数；空间为匹配项个数。
 */
async function collectRemoteHistory(
  user: User,
  predicate: (item: HistoryItem) => boolean,
): Promise<HistoryItem[]> {
  const matches: HistoryItem[] = [];
  let page = 0;

  for (let visited = 0; visited < REMOTE_HISTORY_PAGE_LIMIT; visited += 1) {
    const response = await api.searchRecords.fetchSearchRecords({
      token: user.token,
      page,
      size: HISTORY_PAGE_SIZE,
    });
    const payload: SearchRecordDto[] = Array.isArray(response)
      ? response
      : Array.isArray(response?.items)
        ? response.items
        : [];

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

/**
 * 意图：按语言前缀批量剔除本地词条缓存，确保语言级清理与字典数据同步。
 * 输入：language 需清理的语言标识（期望为大写）。
 * 输出：无直接返回值，通过 store setState 原子性删除命中词条。
 * 流程：
 *  1) 解析语言前缀并检索当前缓存；
 *  2) 基于前缀过滤词条并批量移除；
 * 错误处理：当 language 为空或 store 尚未初始化时直接返回避免误删。
 * 复杂度：O(n)，其中 n 为词条缓存数量。
 */
const pruneWordCacheByLanguage = (language: string) => {
  const normalized = String(language ?? "")
    .trim()
    .toUpperCase();
  if (!normalized) {
    return;
  }
  const prefix = `${normalized}:`;
  useWordStore.setState((state) => {
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
};

function handleApiError(err: unknown, set: SetState) {
  if (err instanceof ApiError && err.status === 401) {
    const { clearUser } = useUserStore.getState();
    clearUser();
    const message = err.message?.trim()
      ? err.message
      : "登录状态已失效，请重新登录";
    set({
      error: message,
      history: [],
      hasMore: false,
      isLoading: false,
      nextPage: 0,
    });
    return;
  }

  console.error(err);
  const message = err instanceof Error ? err.message : String(err);
  set({ error: message, isLoading: false });
}

export const useHistoryStore = createPersistentStore<HistoryState>({
  key: "searchHistory",
  initializer: (set, get) => {
    const wordStore = useWordStore;
    const paginationReducers: Record<
      PaginationMode,
      (current: HistoryItem[], incoming: HistoryItem[]) => HistoryItem[]
    > = {
      [HISTORY_PAGINATION_MODES.RESET]: (_current, incoming) => incoming,
      [HISTORY_PAGINATION_MODES.APPEND]: (current, incoming) =>
        mergeHistory(current, incoming),
    };

    const resolveNextPage = (length: number) => {
      if (length <= 0) return 0;
      return Math.ceil(length / HISTORY_PAGE_SIZE);
    };

    async function loadHistoryPage(
      user: User,
      page: number,
      mode: PaginationMode,
    ) {
      const normalizedPage = Math.max(page, 0);
      const reducer = paginationReducers[mode];
      set(() => ({
        isLoading: true,
        ...(mode === HISTORY_PAGINATION_MODES.RESET
          ? { history: [], error: null, hasMore: true, nextPage: 0 }
          : {}),
      }));
      try {
        const response = await api.searchRecords.fetchSearchRecords({
          token: user.token,
          page: normalizedPage,
          size: HISTORY_PAGE_SIZE,
        });
        const payload: SearchRecordDto[] = Array.isArray(response)
          ? response
          : Array.isArray(response?.items)
            ? response.items
            : [];
        const incoming = payload.map(toHistoryItem);
        set((state) => {
          const merged = reducer(state.history, incoming);
          const ordered = [...merged].sort(compareByCreatedAtDesc);
          const hasMore = incoming.length === HISTORY_PAGE_SIZE;
          const nextPage = resolveNextPage(ordered.length);
          return {
            history: ordered,
            error: null,
            isLoading: false,
            hasMore,
            nextPage,
          };
        });
      } catch (err) {
        handleApiError(err, set);
      }
    }

    return {
      history: [],
      error: null,
      isLoading: false,
      hasMore: false,
      nextPage: 0,
      loadHistory: async (user?: User | null) => {
        if (user?.token) {
          await loadHistoryPage(user, 0, HISTORY_PAGINATION_MODES.RESET);
          return;
        }
        set({
          error: null,
          history: [],
          hasMore: false,
          nextPage: 0,
          isLoading: false,
        });
      },
      loadMoreHistory: async (user?: User | null) => {
        if (!user?.token) return;
        const { isLoading, hasMore, nextPage } = get();
        if (isLoading || !hasMore) return;
        await loadHistoryPage(user, nextPage, HISTORY_PAGINATION_MODES.APPEND);
      },
      addHistory: async (
        term: string,
        user?: User | null,
        language?: string,
        flavor?: string,
      ) => {
        const { historyCaptureEnabled } = useDataGovernanceStore.getState();
        if (!historyCaptureEnabled) {
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
        set((state) => {
          const filtered = state.history.filter(
            (item) => item.termKey !== termKey,
          );
          const next = [placeholder, ...filtered];
          return {
            history: next,
            nextPage: resolveNextPage(next.length),
          };
        });

        if (user) {
          try {
            await api.searchRecords.saveSearchRecord({
              token: user.token,
              term: sanitizedTerm,
              language: normalizedLanguage,
              flavor: normalizedFlavor,
            });
            await loadHistoryPage(user, 0, HISTORY_PAGINATION_MODES.RESET);
          } catch (err) {
            handleApiError(err, set);
          }
        }
      },
      clearHistory: async (user?: User | null) => {
        if (user) {
          api.searchRecords
            .clearSearchRecords({ token: user.token })
            .catch((err) => handleApiError(err, set));
        }
        set({
          history: [],
          error: null,
          hasMore: false,
          isLoading: false,
          nextPage: 0,
        });
      },
      clearHistoryByLanguage: async (language: string, user?: User | null) => {
        const normalized = String(language ?? "")
          .trim()
          .toUpperCase();
        if (!normalized) {
          return;
        }
        const wordState = wordStore.getState();
        const currentHistory = get().history;
        const localCandidates = currentHistory.filter(
          (item) => item.language === normalized,
        );
        if (localCandidates.length > 0) {
          set((state) => {
            const filtered = state.history.filter(
              (item) => item.language !== normalized,
            );
            return {
              history: filtered,
              nextPage: resolveNextPage(filtered.length),
            };
          });
        }

        const aggregated = new Map<string, HistoryItem>();
        localCandidates.forEach((item) => {
          aggregated.set(item.termKey, item);
        });

        if (user?.token) {
          let remoteCandidates: HistoryItem[] = [];
          try {
            remoteCandidates = await collectRemoteHistory(
              user,
              (item) => item.language === normalized,
            );
          } catch (err) {
            handleApiError(err, set);
          }
          remoteCandidates.forEach((item) => {
            aggregated.set(item.termKey, item);
          });
        }

        aggregated.forEach((item) => {
          wordState.removeVersions(item.termKey);
        });

        pruneWordCacheByLanguage(normalized);

        if (!user?.token || aggregated.size === 0) {
          return;
        }

        if (aggregated.size > 0) {
          // 采集 recordId 集合确保针对真实记录主键发起删除，避免旧实现误用版本 ID。
          const recordIds = new Set<string>();
          aggregated.forEach((item) => {
            if (item.recordId) {
              recordIds.add(item.recordId);
            }
          });

          for (const recordId of recordIds.values()) {
            try {
              await api.searchRecords.deleteSearchRecord({
                recordId,
                token: user.token,
              });
            } catch (err) {
              handleApiError(err, set);
              return;
            }
          }

          try {
            await loadHistoryPage(user, 0, HISTORY_PAGINATION_MODES.RESET);
          } catch (err) {
            handleApiError(err, set);
          }
        }
      },
      removeHistory: async (identifier: string, user?: User | null) => {
        const historyItems = get().history;
        const target =
          typeof identifier === "object" && identifier
            ? identifier
            : resolveHistoryItem(historyItems, identifier);
        if (!target) {
          set((state) => {
            const filtered = state.history.filter(
              (item) => item.termKey !== identifier && item.term !== identifier,
            );
            return {
              history: filtered,
              nextPage: resolveNextPage(filtered.length),
            };
          });
          return;
        }

        if (user) {
          const recordId = target.recordId ?? target.latestVersionId;
          if (recordId) {
            try {
              await api.searchRecords.deleteSearchRecord({
                recordId,
                token: user.token,
              });
            } catch (err) {
              handleApiError(err, set);
            }
          }
        }

        set((state) => {
          const filtered = state.history.filter(
            (item) => item.termKey !== target.termKey,
          );
          return {
            history: filtered,
            nextPage: resolveNextPage(filtered.length),
          };
        });
        wordStore.getState().removeVersions(target.termKey);
      },
      favoriteHistory: async (
        identifier: string,
        user?: User | null,
        versionId?: string,
      ) => {
        if (!user) return;
        const target = resolveHistoryItem(get().history, identifier);
        const idToUse =
          versionId ?? target?.recordId ?? target?.latestVersionId ?? null;
        if (!idToUse) return;
        try {
          await api.searchRecords.favoriteSearchRecord({
            token: user.token,
            recordId: idToUse,
          });
          await loadHistoryPage(user, 0, HISTORY_PAGINATION_MODES.RESET);
        } catch (err) {
          handleApiError(err, set);
        }
      },
      unfavoriteHistory: async (
        identifier: string,
        user?: User | null,
        versionId?: string,
      ) => {
        if (!user) return;
        const target = resolveHistoryItem(get().history, identifier);
        const idToUse =
          versionId ?? target?.recordId ?? target?.latestVersionId ?? null;
        if (!idToUse) return;
        try {
          await api.searchRecords.unfavoriteSearchRecord({
            token: user.token,
            recordId: idToUse,
          });
          await loadHistoryPage(user, 0, HISTORY_PAGINATION_MODES.RESET);
        } catch (err) {
          handleApiError(err, set);
        }
      },
      applyRetentionPolicy: async (
        retentionDays: number | null,
        user?: User | null,
      ) => {
        const policy = HistoryRetentionPolicy.forDays(retentionDays);
        if (!policy) {
          return;
        }

        const evaluation = policy.evaluate(get().history);
        if (evaluation.expired.length === 0) {
          return;
        }

        set({
          history: evaluation.retained,
          nextPage: resolveNextPage(evaluation.retained.length),
        });

        evaluation.expired.forEach((item) => {
          wordStore.getState().removeVersions(item.termKey);
        });

        if (user?.token && evaluation.remoteRecordIds.size > 0) {
          for (const recordId of evaluation.remoteRecordIds.values()) {
            try {
              await api.searchRecords.deleteSearchRecord({
                recordId,
                token: user.token,
              });
            } catch (err) {
              handleApiError(err, set);
              return;
            }
          }
        }
      },
    };
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
