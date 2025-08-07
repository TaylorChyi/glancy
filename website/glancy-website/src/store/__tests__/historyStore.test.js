import { jest } from '@jest/globals'
import { act } from '@testing-library/react'
import api from '@/api/index.js'
import { useHistoryStore } from '@/store'

const mockApi = api
mockApi.searchRecords = {
  fetchSearchRecords: jest.fn().mockResolvedValue([]),
  saveSearchRecord: jest.fn().mockResolvedValue({ id: 'r1' }),
  clearSearchRecords: jest.fn().mockResolvedValue(undefined),
  deleteSearchRecord: jest.fn().mockResolvedValue(undefined),
  favoriteSearchRecord: jest.fn().mockResolvedValue(undefined),
  unfavoriteSearchRecord: jest.fn().mockResolvedValue(undefined)
}

const user = { id: 'u1', token: 't' }

describe('historyStore', () => {
  beforeEach(() => {
    localStorage.clear()
    jest.clearAllMocks()
  })

  test('addHistory stores term and calls api', async () => {
    await act(async () => {
      await useHistoryStore.getState().addHistory('test', user, 'ENGLISH')
    })
    expect(mockApi.searchRecords.saveSearchRecord).toHaveBeenCalled()
    expect(useHistoryStore.getState().history[0]).toBe('test')
  })

  test('clearHistory empties store', async () => {
    await act(async () => {
      await useHistoryStore.getState().addHistory('a', user)
    })
    await act(async () => {
      await useHistoryStore.getState().clearHistory(user)
    })
    expect(useHistoryStore.getState().history).toHaveLength(0)
  })
})
