/* eslint-env jest */
import { jest } from "@jest/globals"
import { createApiClient } from '@/api/client.js'

describe('apiRequest error handling', () => {
  afterEach(() => {
    jest.restoreAllMocks()
    delete global.fetch
  })

  test('throws message from JSON body on non-ok response', async () => {
    const resp = {
      ok: false,
      text: jest.fn().mockResolvedValue(JSON.stringify({ message: 'Bad request' })),
      headers: { get: () => 'application/json' },
    }
    global.fetch = jest.fn().mockResolvedValue(resp)
    const apiRequest = createApiClient()
    await expect(apiRequest('/api')).rejects.toThrow('Bad request')
  })

  test('throws plain text message on non-ok response', async () => {
    const resp = {
      ok: false,
      text: jest.fn().mockResolvedValue('Server error'),
      headers: { get: () => 'text/plain' },
    }
    global.fetch = jest.fn().mockResolvedValue(resp)
    const apiRequest = createApiClient()
    await expect(apiRequest('/api')).rejects.toThrow('Server error')
  })

  test('throws unified message on network failure', async () => {
    const error = new Error('network down')
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {})
    global.fetch = jest.fn().mockRejectedValue(error)
    const apiRequest = createApiClient()
    await expect(apiRequest('/api')).rejects.toThrow('Network error')
    expect(spy).toHaveBeenCalledWith(error)
  })
})
