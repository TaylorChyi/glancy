import { createPersistentStore } from "./createPersistentStore.ts";
import { pickState } from "./persistUtils.ts";

export const useWordStore = createPersistentStore({
  key: "wordCache",
  initializer: (set, get) => ({
    entries: {},
    setEntry: (key, entry) =>
      set((state) => ({ entries: { ...state.entries, [key]: entry } })),
    getEntry: (key) => get().entries[key],
    clear: () => set({ entries: {} }),
    removeVersions: (termKey) =>
      set((state) => {
        if (!termKey) return {};
        const prefix = `${termKey}:`;
        const entries = Object.fromEntries(
          Object.entries(state.entries).filter(
            ([key]) => !key.startsWith(prefix),
          ),
        );
        return { entries };
      }),
  }),
  persistOptions: {
    partialize: pickState(["entries"]),
  },
});
