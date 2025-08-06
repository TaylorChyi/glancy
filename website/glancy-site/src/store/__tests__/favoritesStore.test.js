import { act } from '@testing-library/react'
import { useFavoritesStore } from '@/store'

describe('favoritesStore', () => {
  beforeEach(() => localStorage.clear())

  test('toggleFavorite adds and removes terms', () => {
    act(() => useFavoritesStore.getState().toggleFavorite('hello'))
    expect(useFavoritesStore.getState().favorites).toContain('hello')
    act(() => useFavoritesStore.getState().toggleFavorite('hello'))
    expect(useFavoritesStore.getState().favorites).not.toContain('hello')
  })
})
