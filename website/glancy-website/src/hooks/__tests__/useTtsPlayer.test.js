/* eslint-env jest */
import { renderHook, act } from '@testing-library/react'
import { jest } from '@jest/globals'
import { ApiError } from '@/api/client.js'

// mock global Audio element
const playSpy = jest.fn().mockResolvedValue()
beforeAll(() => {
  class MockResponse {
    constructor(_body, init = {}) {
      this.status = init.status
    }
  }
  global.Response = MockResponse
  global.Audio = jest.fn().mockImplementation(() => ({
    play: playSpy,
    pause: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
  }))
})

// mock useApi to supply tts methods
const speakWord = jest.fn()
jest.unstable_mockModule('@/hooks/useApi.js', () => ({
  useApi: () => ({ tts: { speakWord } }),
}))

const { useTtsPlayer } = await import('@/hooks/useTtsPlayer.js')

describe('useTtsPlayer', () => {
  afterEach(() => {
    speakWord.mockReset()
    playSpy.mockClear()
  })

  /**
   * Ensures shortcut request retries with shortcut=false when server responds 204
   * and that all parameters are forwarded correctly.
   */
  test('retries with fallback when cache miss', async () => {
    speakWord.mockResolvedValueOnce(new Response(null, { status: 204 }))
    speakWord.mockResolvedValueOnce({ url: 'audio.mp3' })

    const { result } = renderHook(() => useTtsPlayer())

    await act(async () => {
      await result.current.play({ text: 'hi', lang: 'en', voice: 'v1' })
    })

    const payload = {
      text: 'hi',
      lang: 'en',
      voice: 'v1',
      speed: 1,
      format: 'mp3',
      shortcut: true,
    }
    expect(speakWord).toHaveBeenNthCalledWith(1, payload)
    expect(speakWord).toHaveBeenNthCalledWith(2, { ...payload, shortcut: false })
    expect(playSpy).toHaveBeenCalled()
  })

  /**
   * Confirms 401 errors prompt login feedback.
   */
  test('handles unauthorized error', async () => {
    speakWord.mockRejectedValueOnce(new ApiError(401, 'Unauthorized'))

    const { result } = renderHook(() => useTtsPlayer())

    await act(async () => {
      await result.current.play({ text: 'hi', lang: 'en' })
    })

    expect(result.current.error).toBe('请登录后重试')
  })
})
