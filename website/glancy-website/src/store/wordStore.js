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
  }),
  persistOptions: {
    partialize: pickState(["entries"]),
  },
});
