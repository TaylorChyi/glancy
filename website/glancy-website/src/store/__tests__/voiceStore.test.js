import { act } from '@testing-library/react'
import { useVoiceStore } from '@/store'

/**
 * Voice store persistence and retrieval.
 */
describe('voiceStore', () => {
  beforeEach(() => localStorage.clear())

  test('setVoice persists voice per language', () => {
    act(() => useVoiceStore.getState().setVoice('en', 'v1'))
    expect(useVoiceStore.getState().getVoice('en')).toBe('v1')
    const stored = JSON.parse(localStorage.getItem('ttsVoicePrefs'))
    expect(stored.state.voices.en).toBe('v1')
  })
})
