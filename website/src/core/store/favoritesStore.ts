import { createPersistentStore } from "./createPersistentStore.js";
import { pickState } from "./persistUtils.js";
import { STORE_KEYS } from "./storeKeys.js";

interface FavoritesState {
  favorites: string[];
  toggleFavorite: (term: string) => void;
}

export const useFavoritesStore = createPersistentStore<FavoritesState>({
  key: STORE_KEYS.FAVORITES,
  initializer: (set, get) => ({
    favorites: [],
    toggleFavorite: (term: string) => {
      const list = get().favorites;
      const updated = list.includes(term)
        ? list.filter((t) => t !== term)
        : [...list, term];
      set({ favorites: updated });
    },
  }),
  persistOptions: {
    partialize: pickState(["favorites"]),
  },
});
