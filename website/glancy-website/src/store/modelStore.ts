import { createPersistentStore } from './createPersistentStore.ts'
import { pickState } from './persistUtils.ts'

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
