import api from "@/api/index.js";
import { ApiError } from "@/api/client.js";
import { createPersistentStore } from "./createPersistentStore.js";
import { pickState } from "./persistUtils.js";
import { useUserStore } from "./userStore.js";
import type { User } from "./userStore.js";
import {
  resolveWordLanguage,
  WORD_LANGUAGE_AUTO,
  WORD_FLAVOR_BILINGUAL,
} from "@/utils/language.js";
import { useWordStore } from "./wordStore.js";
import { useDataGovernanceStore } from "./dataGovernanceStore.js";

const HISTORY_PAGE_SIZE = 20;

type SearchRecordDto = {
  id?: string | number | null;
  term: string;
  language?: string | null;
  flavor?: string | null;
  createdAt?: string | null;
  favorite?: boolean | null;
  versions?: Array<{
    id?: string | number | null;
    createdAt?: string | null;
    favorite?: boolean | null;
  }> | null;
};

export interface HistoryVersion {
  id: string;
  createdAt: string | null;
  favorite: boolean;
}

export interface HistoryItem {
  term: string;
  /**
   * 展示用词条，通常为模型纠正后的结果；若缺失则回退 term。
   */
  displayTerm: string;
  /**
   * 用户原始查询词，便于与后端记录对齐及后续追踪。
   */
  queriedTerm?: string | null;
  language: string;
  flavor: string;
  termKey: string;
  createdAt: string | null;
  favorite: boolean;
  versions: HistoryVersion[];
  latestVersionId: string | null;
}

interface CanonicalTermRegistry {
  [termKey: string]: string;
}

interface HistoryState {
  history: HistoryItem[];
  error: string | null;
  isLoading: boolean;
  hasMore: boolean;
  nextPage: number;
  canonicalTerms: CanonicalTermRegistry;
  loadHistory: (user?: User | null) => Promise<void>;
  loadMoreHistory: (user?: User | null) => Promise<void>;
  addHistory: (payload: {
    term: string;
    queriedTerm?: string;
    user?: User | null;
    language?: string;
    flavor?: string;
  }) => Promise<void>;
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

const createTermKey = (term: string, language: string, flavor: string) =>
  `${language}:${flavor}:${term}`;

const normalizeLanguage = (term: string, language?: string | null) =>
  resolveWordLanguage(term, language ?? WORD_LANGUAGE_AUTO).toUpperCase();

const normalizeFlavor = (flavor?: string | null) => {
  if (!flavor) return WORD_FLAVOR_BILINGUAL;
  const upper = String(flavor).trim().toUpperCase();
  return upper || WORD_FLAVOR_BILINGUAL;
};

const sanitizeVersion = (
  version: SearchRecordDto["versions"] extends (infer R)[] ? R : never,
  fallback: { createdAt?: string | null; favorite?: boolean | null },
): HistoryVersion | null => {
  if (!version || version.id == null) return null;
  return {
    id: String(version.id),
    createdAt: version.createdAt ?? fallback.createdAt ?? null,
    favorite: Boolean(version.favorite ?? fallback.favorite ?? false),
  };
};

const ensureVersions = (record: SearchRecordDto): HistoryVersion[] => {
  const fallback = {
    createdAt: record.createdAt ?? null,
    favorite: record.favorite ?? null,
  };
  const provided = (record.versions ?? [])
    .map((version) => sanitizeVersion(version, fallback))
    .filter((v): v is HistoryVersion => Boolean(v));
  if (provided.length > 0) {
    return provided.sort((a, b) => {
      const left = a.createdAt ?? "";
      const right = b.createdAt ?? "";
      return right.localeCompare(left);
    });
  }
  if (record.id == null) return [];
  return [
    {
      id: String(record.id),
      createdAt: record.createdAt ?? null,
      favorite: Boolean(record.favorite ?? false),
    },
  ];
};

const toHistoryItem = (record: SearchRecordDto): HistoryItem => {
  const language = normalizeLanguage(record.term, record.language);
  const flavor = normalizeFlavor(record.flavor);
  const versions = ensureVersions(record);
  const latestVersionId = versions.length ? versions[0].id : null;
  return {
    term: record.term,
    displayTerm: record.term,
    queriedTerm: record.term,
    language,
    flavor,
    termKey: createTermKey(record.term, language, flavor),
    createdAt: record.createdAt ?? versions[0]?.createdAt ?? null,
    favorite: Boolean(record.favorite ?? versions[0]?.favorite ?? false),
    versions,
    latestVersionId,
  };
};

const compareByCreatedAtDesc = (a: HistoryItem, b: HistoryItem) => {
  const left = a.createdAt ?? "";
  const right = b.createdAt ?? "";
  if (!left && !right) return 0;
  if (!left) return 1;
  if (!right) return -1;
  return right.localeCompare(left);
};

const normalizeDisplayTerm = (term?: string | null) => {
  if (typeof term !== "string") return "";
  const trimmed = term.trim();
  return trimmed;
};

const applyDisplayTerm = (
  item: HistoryItem,
  canonicalTerms: CanonicalTermRegistry,
): HistoryItem => {
  const candidate = canonicalTerms[item.termKey];
  const normalized = normalizeDisplayTerm(candidate);
  const resolved = normalized || item.displayTerm || item.term;
  if (item.displayTerm === resolved && item.term === resolved) {
    return item;
  }
  return { ...item, term: resolved, displayTerm: resolved };
};

const withCanonicalTerms = (
  items: HistoryItem[],
  canonicalTerms: CanonicalTermRegistry,
) => items.map((item) => applyDisplayTerm(item, canonicalTerms));

const mergeHistory = (existing: HistoryItem[], incoming: HistoryItem[]) => {
  const map = new Map<string, HistoryItem>();
  const orderedIncoming = [...incoming].sort(compareByCreatedAtDesc);
  orderedIncoming.forEach((item) => {
    map.set(item.termKey, item);
  });
  existing.forEach((item) => {
    if (!map.has(item.termKey)) {
      map.set(item.termKey, item);
    }
  });
  return Array.from(map.values());
};

const PAGINATION_MODES = Object.freeze({
  RESET: "reset",
  APPEND: "append",
} as const);

type PaginationMode = (typeof PAGINATION_MODES)[keyof typeof PAGINATION_MODES];

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
      canonicalTerms: {},
    });
    return;
  }

  console.error(err);
  const message = err instanceof Error ? err.message : String(err);
  set({ error: message, isLoading: false });
}

const resolveHistoryItem = (history: HistoryItem[], identifier: string) =>
  history.find(
    (item) =>
      item.termKey === identifier ||
      item.term === identifier ||
      `${item.language}:${item.term}` === identifier,
  );

export const useHistoryStore = createPersistentStore<HistoryState>({
  key: "searchHistory",
  initializer: (set, get) => {
    const wordStore = useWordStore;
    const paginationReducers: Record<
      PaginationMode,
      (current: HistoryItem[], incoming: HistoryItem[]) => HistoryItem[]
    > = {
      [PAGINATION_MODES.RESET]: (_current, incoming) => incoming,
      [PAGINATION_MODES.APPEND]: (current, incoming) =>
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
        ...(mode === PAGINATION_MODES.RESET
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
          const canonicalTerms = state.canonicalTerms;
          const normalizedIncoming = withCanonicalTerms(
            incoming,
            canonicalTerms,
          );
          const merged = reducer(state.history, normalizedIncoming);
          const ordered = withCanonicalTerms(
            [...merged].sort(compareByCreatedAtDesc),
            canonicalTerms,
          );
          const hasMore = normalizedIncoming.length === HISTORY_PAGE_SIZE;
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
      canonicalTerms: {},
      loadHistory: async (user?: User | null) => {
        if (user?.token) {
          await loadHistoryPage(user, 0, PAGINATION_MODES.RESET);
          return;
        }
        set({
          error: null,
          history: [],
          hasMore: false,
          nextPage: 0,
          isLoading: false,
          canonicalTerms: {},
        });
      },
      loadMoreHistory: async (user?: User | null) => {
        if (!user?.token) return;
        const { isLoading, hasMore, nextPage } = get();
        if (isLoading || !hasMore) return;
        await loadHistoryPage(user, nextPage, PAGINATION_MODES.APPEND);
      },
      addHistory: async ({
        term,
        queriedTerm,
        user,
        language,
        flavor,
      }: {
        term: string;
        queriedTerm?: string;
        user?: User | null;
        language?: string;
        flavor?: string;
      }) => {
        const { historyCaptureEnabled } = useDataGovernanceStore.getState();
        if (!historyCaptureEnabled) {
          return;
        }
        const normalizedQuery =
          normalizeDisplayTerm(queriedTerm) || term.trim();
        const canonicalTerm = normalizeDisplayTerm(term) || normalizedQuery;
        if (!canonicalTerm) {
          return;
        }
        const normalizedLanguage = normalizeLanguage(normalizedQuery, language);
        const normalizedFlavor = normalizeFlavor(flavor);
        const termKey = createTermKey(
          normalizedQuery,
          normalizedLanguage,
          normalizedFlavor,
        );
        const now = new Date().toISOString();
        const placeholder: HistoryItem = {
          term: canonicalTerm,
          displayTerm: canonicalTerm,
          queriedTerm: normalizedQuery,
          language: normalizedLanguage,
          flavor: normalizedFlavor,
          termKey,
          createdAt: now,
          favorite: false,
          versions: [],
          latestVersionId: null,
        };
        set((state) => {
          const canonicalTerms = {
            ...state.canonicalTerms,
            [termKey]: canonicalTerm,
          };
          const filtered = state.history.filter(
            (item) => item.termKey !== termKey,
          );
          const hydrated = filtered.map((item) =>
            applyDisplayTerm(item, canonicalTerms),
          );
          const next = [placeholder, ...hydrated];
          return {
            history: next,
            canonicalTerms,
            nextPage: resolveNextPage(next.length),
          };
        });

        if (user) {
          try {
            await api.searchRecords.saveSearchRecord({
              token: user.token,
              term: canonicalTerm,
              language: normalizedLanguage,
              flavor: normalizedFlavor,
            });
            await loadHistoryPage(user, 0, PAGINATION_MODES.RESET);
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
          canonicalTerms: {},
        });
      },
      clearHistoryByLanguage: async (language: string, user?: User | null) => {
        const normalized = String(language ?? "")
          .trim()
          .toUpperCase();
        if (!normalized) {
          return;
        }
        const currentHistory = get().history;
        const candidates = currentHistory.filter(
          (item) => item.language === normalized,
        );
        if (candidates.length === 0) {
          return;
        }

        set((state) => {
          const filtered = state.history.filter(
            (item) => item.language !== normalized,
          );
          const canonicalTerms = { ...state.canonicalTerms };
          state.history
            .filter((item) => item.language === normalized)
            .forEach((item) => {
              delete canonicalTerms[item.termKey];
            });
          return {
            history: filtered,
            canonicalTerms,
            nextPage: resolveNextPage(filtered.length),
          };
        });

        candidates.forEach((item) => {
          wordStore.getState().removeVersions(item.termKey);
        });

        if (user?.token) {
          for (const item of candidates) {
            const versionIds = item.versions.length
              ? item.versions.map((version) => version.id)
              : item.latestVersionId
                ? [item.latestVersionId]
                : [];
            for (const versionId of versionIds) {
              try {
                await api.searchRecords.deleteSearchRecord({
                  recordId: versionId,
                  token: user.token,
                });
              } catch (err) {
                handleApiError(err, set);
                return;
              }
            }
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
            const canonicalTerms = { ...state.canonicalTerms };
            state.history
              .filter(
                (item) =>
                  item.termKey === identifier || item.term === identifier,
              )
              .forEach((item) => {
                delete canonicalTerms[item.termKey];
              });
            return {
              history: filtered,
              canonicalTerms,
              nextPage: resolveNextPage(filtered.length),
            };
          });
          return;
        }

        if (user) {
          const versionIds = target.versions.length
            ? target.versions.map((version) => version.id)
            : target.latestVersionId
              ? [target.latestVersionId]
              : [];
          for (const versionId of versionIds) {
            try {
              await api.searchRecords.deleteSearchRecord({
                recordId: versionId,
                token: user.token,
              });
            } catch (err) {
              handleApiError(err, set);
              break;
            }
          }
        }

        set((state) => {
          const filtered = state.history.filter(
            (item) => item.termKey !== target.termKey,
          );
          const canonicalTerms = { ...state.canonicalTerms };
          delete canonicalTerms[target.termKey];
          return {
            history: filtered,
            canonicalTerms,
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
        const idToUse = versionId ?? target?.latestVersionId;
        if (!idToUse) return;
        try {
          await api.searchRecords.favoriteSearchRecord({
            token: user.token,
            recordId: idToUse,
          });
          await loadHistoryPage(user, 0, PAGINATION_MODES.RESET);
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
        const idToUse = versionId ?? target?.latestVersionId;
        if (!idToUse) return;
        try {
          await api.searchRecords.unfavoriteSearchRecord({
            token: user.token,
            recordId: idToUse,
          });
          await loadHistoryPage(user, 0, PAGINATION_MODES.RESET);
        } catch (err) {
          handleApiError(err, set);
        }
      },
      applyRetentionPolicy: async (
        retentionDays: number | null,
        user?: User | null,
      ) => {
        if (retentionDays == null || retentionDays <= 0) {
          return;
        }
        const threshold = Date.now() - retentionDays * 24 * 60 * 60 * 1000;
        const historyItems = get().history;
        const candidates = historyItems.filter((item) => {
          if (!item.createdAt) {
            return false;
          }
          const timestamp = Date.parse(item.createdAt);
          if (Number.isNaN(timestamp)) {
            return false;
          }
          return timestamp < threshold;
        });
        if (candidates.length === 0) {
          return;
        }

        set((state) => {
          const filtered = state.history.filter(
            (item) =>
              !candidates.some(
                (candidate) => candidate.termKey === item.termKey,
              ),
          );
          const canonicalTerms = { ...state.canonicalTerms };
          candidates.forEach((item) => {
            delete canonicalTerms[item.termKey];
          });
          return {
            history: filtered,
            canonicalTerms,
            nextPage: resolveNextPage(filtered.length),
          };
        });

        candidates.forEach((item) => {
          wordStore.getState().removeVersions(item.termKey);
        });

        if (user?.token) {
          for (const item of candidates) {
            const versionIds = item.versions.length
              ? item.versions.map((version) => version.id)
              : item.latestVersionId
                ? [item.latestVersionId]
                : [];
            for (const versionId of versionIds) {
              try {
                await api.searchRecords.deleteSearchRecord({
                  recordId: versionId,
                  token: user.token,
                });
              } catch (err) {
                handleApiError(err, set);
                return;
              }
            }
          }
        }
      },
    };
  },
  persistOptions: {
    partialize: pickState(["history", "canonicalTerms"]),
    version: 4,
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
      if (version !== undefined && version < 4) {
        const upgraded = Array.isArray(nextState.history)
          ? nextState.history.map((item: any) => {
              if (!item || typeof item !== "object") {
                return item;
              }
              const term = typeof item.term === "string" ? item.term : "";
              const normalizedTerm = term.trim();
              const displayTerm =
                typeof item.displayTerm === "string" && item.displayTerm.trim()
                  ? item.displayTerm.trim()
                  : normalizedTerm;
              const queriedTerm =
                typeof item.queriedTerm === "string" && item.queriedTerm.trim()
                  ? item.queriedTerm.trim()
                  : normalizedTerm;
              return {
                ...item,
                term: normalizedTerm,
                displayTerm: displayTerm || normalizedTerm,
                queriedTerm: queriedTerm || normalizedTerm,
              } as HistoryItem;
            })
          : [];
        nextState = {
          ...nextState,
          history: upgraded,
          canonicalTerms: {},
        };
      }
      return nextState;
    },
  },
});
