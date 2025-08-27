import { createPersistentStore } from "./createPersistentStore";
import { pickState } from "./persistUtils";

export interface WordEntry {
  markdown?: string;
  [key: string]: unknown;
}

interface WordStoreState {
  entries: Record<string, WordEntry>;
  setEntry: (key: string, entry: WordEntry) => void;
  getEntry: (key: string) => WordEntry | undefined;
  clear: () => void;
}

export const useWordStore = createPersistentStore<WordStoreState>({
  key: "wordCache",
  initializer: (set, get) => ({
    entries: {},
    setEntry: (key, entry) =>
      set((state) => ({ entries: { ...state.entries, [key]: entry } })),
    getEntry: (key) => get().entries[key],
    clear: () => set({ entries: {} }),
  }),
  persistOptions: {
    partialize: pickState(["entries"]),
  },
});
