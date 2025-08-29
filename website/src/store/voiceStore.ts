import { createPersistentStore } from './createPersistentStore.js'
import { pickState } from './persistUtils.js'

interface VoiceState {
  voices: Record<string, string>
  setVoice: (lang: string, voiceId: string) => void
  getVoice: (lang: string) => string | undefined
}

export const useVoiceStore = createPersistentStore<VoiceState>({
  key: 'ttsVoicePrefs',
  initializer: (set, get) => ({
    voices: {},
    setVoice: (lang: string, voiceId: string) =>
      set((state) => ({ voices: { ...state.voices, [lang]: voiceId } })),
    getVoice: (lang: string) => get().voices[lang],
  }),
  persistOptions: {
    partialize: pickState(['voices']),
  },
})
