import { act } from '@testing-library/react'
import { useUserStore } from '@/store'

describe('userStore', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  test('setUser and clearUser persist to storage', () => {
    const user = { id: '1', token: 't' }
    act(() => useUserStore.getState().setUser(user))
    expect(useUserStore.getState().user).toEqual(user)
    const stored = JSON.parse(localStorage.getItem('user'))
    expect(stored.state.user).toEqual(user)
    act(() => useUserStore.getState().clearUser())
    expect(useUserStore.getState().user).toBeNull()
    const cleared = JSON.parse(localStorage.getItem('user'))
    expect(cleared.state.user).toBeNull()
  })
})
