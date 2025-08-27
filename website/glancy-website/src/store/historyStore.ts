import api from "@/api/index.js";
import { createPersistentStore } from "./createPersistentStore";
import { pickState } from "./persistUtils";
import type { User } from "./userStore";
import { detectWordLanguage } from "@/utils";

interface HistoryState {
  history: string[];
  recordMap: Record<string, string>;
  error: string | null;
  loadHistory: (user?: User | null) => Promise<void>;
  addHistory: (
    term: string,
    user?: User | null,
    language?: string,
  ) => Promise<void>;
  clearHistory: (user?: User | null) => Promise<void>;
  removeHistory: (term: string, user?: User | null) => Promise<void>;
  favoriteHistory: (term: string, user?: User | null) => Promise<void>;
  unfavoriteHistory: (term: string, user?: User | null) => Promise<void>;
}

type SetState = (
  partial:
    | Partial<HistoryState>
    | ((state: HistoryState) => Partial<HistoryState>),
  replace?: boolean,
) => void;

function handleApiError(err: unknown, set: SetState) {
  console.error(err);
  const message = err instanceof Error ? err.message : String(err);
  set({ error: message });
}

export const useHistoryStore = createPersistentStore<HistoryState>({
  key: "searchHistory",
  initializer: (set, get) => {
    async function refreshHistory(user: User) {
      try {
        const records = await api.searchRecords.fetchSearchRecords({
          token: user.token,
        });
        const terms = records.map((r) => r.term);
        const map: Record<string, string> = {};
        records.forEach((r) => {
          if (r.id) map[r.term] = r.id;
        });
        const existing = get().history;
        const combined = Array.from(new Set([...terms, ...existing]));
        set((state) => ({
          history: combined,
          recordMap: { ...state.recordMap, ...map },
        }));
      } catch (err) {
        handleApiError(err, set);
      }
    }

    return {
      history: [],
      recordMap: {},
      error: null,
      loadHistory: async (user?: User | null) => {
        if (user) {
          await refreshHistory(user);
        } else {
          set({ recordMap: {}, error: null });
        }
      },
      addHistory: async (
        term: string,
        user?: User | null,
        language?: string,
      ) => {
        const langToSave = language ?? detectWordLanguage(term);
        if (user) {
          try {
            const record = await api.searchRecords.saveSearchRecord({
              token: user.token,
              term,
              language: langToSave,
            });
            set((state) => ({
              recordMap: { ...state.recordMap, [term]: record.id },
            }));
            refreshHistory(user);
          } catch (err) {
            handleApiError(err, set);
          }
        }
        const unique = Array.from(new Set([term, ...get().history])).slice(
          0,
          20,
        );
        set({ history: unique });
      },
      clearHistory: async (user?: User | null) => {
        if (user) {
          api.searchRecords
            .clearSearchRecords({ token: user.token })
            .catch((err) => handleApiError(err, set));
        }
        set({ history: [], recordMap: {} });
      },
      removeHistory: async (term: string, user?: User | null) => {
        if (user) {
          const id = get().recordMap[term];
          if (id) {
            api.searchRecords
              .deleteSearchRecord({ recordId: id, token: user.token })
              .catch((err) => handleApiError(err, set));
          }
        }
        const updated = get().history.filter((t) => t !== term);
        set((state) => {
          const map = { ...state.recordMap };
          delete map[term];
          return { history: updated, recordMap: map };
        });
      },
      favoriteHistory: async (term: string, user?: User | null) => {
        const id = get().recordMap[term];
        if (user && id) {
          api.searchRecords
            .favoriteSearchRecord({ token: user.token, recordId: id })
            .catch((err) => handleApiError(err, set));
        }
      },
      unfavoriteHistory: async (term: string, user?: User | null) => {
        const id = get().recordMap[term];
        if (user && id) {
          api.searchRecords
            .unfavoriteSearchRecord({ token: user.token, recordId: id })
            .catch((err) => handleApiError(err, set));
        }
      },
    };
  },
  persistOptions: {
    partialize: pickState(["history"]),
  },
});
