import { createPersistentStore } from './createPersistentStore.ts'
import { pickState } from './persistUtils.ts'

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
