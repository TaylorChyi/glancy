import api from "@/api/index.js";
import { ApiError } from "@/api/client.js";
import { createPersistentStore } from "./createPersistentStore.js";
import { pickState } from "./persistUtils.js";
import { useUserStore } from "./userStore.js";
import type { User } from "./userStore.js";
import { resolveWordLanguage, WORD_LANGUAGE_AUTO } from "@/utils/language.js";
import { useWordStore } from "./wordStore.js";

const HISTORY_LIMIT = 20;

type SearchRecordDto = {
  id?: string | number | null;
  term: string;
  language?: string | null;
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
  language: string;
  termKey: string;
  createdAt: string | null;
  favorite: boolean;
  versions: HistoryVersion[];
  latestVersionId: string | null;
}

interface HistoryState {
  history: HistoryItem[];
  error: string | null;
  loadHistory: (user?: User | null) => Promise<void>;
  addHistory: (
    term: string,
    user?: User | null,
    language?: string,
  ) => Promise<void>;
  clearHistory: (user?: User | null) => Promise<void>;
  removeHistory: (identifier: string, user?: User | null) => Promise<void>;
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
}

type SetState = (
  partial:
    | Partial<HistoryState>
    | ((state: HistoryState) => Partial<HistoryState>),
  replace?: boolean,
) => void;

const createTermKey = (term: string, language: string) => `${language}:${term}`;

const normalizeLanguage = (term: string, language?: string | null) =>
  resolveWordLanguage(term, language ?? WORD_LANGUAGE_AUTO).toUpperCase();

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
  const versions = ensureVersions(record);
  const latestVersionId = versions.length ? versions[0].id : null;
  return {
    term: record.term,
    language,
    termKey: createTermKey(record.term, language),
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

function handleApiError(err: unknown, set: SetState) {
  if (err instanceof ApiError && err.status === 401) {
    const { clearUser } = useUserStore.getState();
    clearUser();
    const message = err.message?.trim()
      ? err.message
      : "登录状态已失效，请重新登录";
    set({ error: message, history: [] });
    return;
  }

  console.error(err);
  const message = err instanceof Error ? err.message : String(err);
  set({ error: message });
}

const resolveHistoryItem = (history: HistoryItem[], identifier: string) =>
  history.find(
    (item) => item.termKey === identifier || item.term === identifier,
  );

export const useHistoryStore = createPersistentStore<HistoryState>({
  key: "searchHistory",
  initializer: (set, get) => {
    const wordStore = useWordStore;

    async function refreshHistory(user: User) {
      try {
        const response = await api.searchRecords.fetchSearchRecords({
          token: user.token,
        });
        const payload: SearchRecordDto[] = Array.isArray(response)
          ? response
          : Array.isArray(response?.items)
            ? response.items
            : [];
        const incoming = payload.map(toHistoryItem);
        set((state) => {
          const merged = mergeHistory(state.history, incoming);
          const ordered = [...merged]
            .sort(compareByCreatedAtDesc)
            .slice(0, HISTORY_LIMIT);
          return {
            history: ordered,
            error: null,
          };
        });
      } catch (err) {
        handleApiError(err, set);
      }
    }

    return {
      history: [],
      error: null,
      loadHistory: async (user?: User | null) => {
        if (user) {
          await refreshHistory(user);
        } else {
          set({ error: null });
        }
      },
      addHistory: async (
        term: string,
        user?: User | null,
        language?: string,
      ) => {
        const normalizedLanguage = normalizeLanguage(term, language);
        const termKey = createTermKey(term, normalizedLanguage);
        const now = new Date().toISOString();
        const placeholder: HistoryItem = {
          term,
          language: normalizedLanguage,
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
          const next = [placeholder, ...filtered].slice(0, HISTORY_LIMIT);
          return { history: next };
        });

        if (user) {
          try {
            await api.searchRecords.saveSearchRecord({
              token: user.token,
              term,
              language: normalizedLanguage,
            });
            await refreshHistory(user);
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
        set({ history: [], error: null });
      },
      removeHistory: async (identifier: string, user?: User | null) => {
        const target = resolveHistoryItem(get().history, identifier);
        if (!target) {
          set((state) => ({
            history: state.history.filter(
              (item) => item.termKey !== identifier && item.term !== identifier,
            ),
          }));
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

        set((state) => ({
          history: state.history.filter(
            (item) => item.termKey !== target.termKey,
          ),
        }));
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
          await refreshHistory(user);
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
          await refreshHistory(user);
        } catch (err) {
          handleApiError(err, set);
        }
      },
    };
  },
  persistOptions: {
    partialize: pickState(["history"]),
    version: 2,
    migrate: (persistedState, version) => {
      if (!persistedState) return persistedState;
      if (version === undefined || version < 2) {
        const legacy = Array.isArray(persistedState.history)
          ? persistedState.history
          : [];
        const upgraded = legacy.map((item) => {
          if (typeof item === "string") {
            const language = normalizeLanguage(item);
            return {
              term: item,
              language,
              termKey: createTermKey(item, language),
              createdAt: null,
              favorite: false,
              versions: [],
              latestVersionId: null,
            } satisfies HistoryItem;
          }
          return item;
        });
        return { ...persistedState, history: upgraded };
      }
      return persistedState;
    },
  },
});
