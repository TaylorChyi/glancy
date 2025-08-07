import { act } from '@testing-library/react'
import { useModelStore } from '@/store'

describe('modelStore', () => {
  beforeEach(() => localStorage.clear())

  test('setModel updates state and storage', () => {
    act(() => useModelStore.getState().setModel('GPT'))
    expect(useModelStore.getState().model).toBe('GPT')
    const stored = JSON.parse(localStorage.getItem('dictionaryModel'))
    expect(stored.state.model).toBe('GPT')
  })
})
