import { createPersistentStore } from './createPersistentStore.js'
import { pickState } from './persistUtils.js'

interface ModelState {
  model: string
  setModel: (value: string) => void
}

export const useModelStore = createPersistentStore<ModelState>({
  key: 'dictionaryModel',
  initializer: (set) => ({
    model: 'DEEPSEEK',
    setModel: (value: string) => {
      set({ model: value })
    }
  }),
  persistOptions: {
    partialize: pickState(['model'])
  }
})
