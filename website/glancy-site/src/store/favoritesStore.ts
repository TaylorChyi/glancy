import { createPersistentStore } from './createPersistentStore.ts'
import { pickState } from './persistUtils.ts'

interface FavoritesState {
  favorites: string[]
  toggleFavorite: (term: string) => void
}

export const useFavoritesStore = createPersistentStore<FavoritesState>({
  key: 'favorites',
  initializer: (set, get) => ({
    favorites: [],
    toggleFavorite: (term: string) => {
      const list = get().favorites
      const updated = list.includes(term)
        ? list.filter((t) => t !== term)
        : [...list, term]
      set({ favorites: updated })
    }
  }),
  persistOptions: {
    partialize: pickState(['favorites'])
  }
})
