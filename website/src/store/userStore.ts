import { createPersistentStore } from './createPersistentStore.js'
import { pickState } from './persistUtils.js'

export interface User {
  id: string
  token: string
  avatar?: string
  [key: string]: unknown
}

interface UserState {
  user: User | null
  setUser: (user: User) => void
  clearUser: () => void
}

export const useUserStore = createPersistentStore<UserState>({
  key: 'user',
  initializer: (set) => ({
    user: null,
    setUser: (user: User) => {
      set({ user })
    },
    clearUser: () => {
      set({ user: null })
    }
  }),
  persistOptions: {
    partialize: pickState(['user'])
  }
})
