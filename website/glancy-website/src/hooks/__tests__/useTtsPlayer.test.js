/* eslint-env jest */
import { renderHook, act } from '@testing-library/react'
import { jest } from '@jest/globals'

// mock apiRequest and ApiError
class ApiError extends Error {
  constructor(status, message, headers) {
    super(message)
    this.status = status
    this.headers = headers
  }
}
const apiRequest = jest.fn()

jest.unstable_mockModule('@/api/client.js', () => ({ ApiError, apiRequest }))
jest.unstable_mockModule('@/config/api.js', () => ({
  API_PATHS: { ttsWord: '/api/tts/word', ttsSentence: '/api/tts/sentence' },
}))

// mock global Audio element
const playSpy = jest.fn().mockResolvedValue()
const pauseSpies = []
beforeAll(() => {
  global.URL.createObjectURL = jest.fn(() => 'blob:mock')
  global.URL.revokeObjectURL = jest.fn()
  global.Audio = jest.fn().mockImplementation(() => {
    const handlers = {}
    const pause = jest.fn(() => handlers.pause?.())
    pauseSpies.push(pause)
    return {
      play: playSpy,
      pause,
      addEventListener: jest.fn((e, cb) => {
        handlers[e] = cb
      }),
      removeEventListener: jest.fn((e) => {
        delete handlers[e]
      }),
    }
  })
})

afterEach(() => {
  apiRequest.mockReset()
  playSpy.mockClear()
  pauseSpies.length = 0
})

const { useTtsPlayer } = await import('@/hooks/useTtsPlayer.js')

describe('useTtsPlayer', () => {
  test('plays audio when request succeeds', async () => {
    apiRequest.mockResolvedValueOnce({ blob: () => Promise.resolve(new Blob()) })
    const { result } = renderHook(() => useTtsPlayer())
    await act(async () => {})
    await act(async () => {
      await result.current.play({ text: 'hi', lang: 'en', voice: 'v1' })
    })
    expect(apiRequest).toHaveBeenCalledWith(
      '/api/tts/word/audio?text=hi&lang=en&format=mp3&speed=1&voice=v1',
    )
    expect(playSpy).toHaveBeenCalled()
    expect(result.current.playing).toBe(true)
  })

  test('handles unauthorized error', async () => {
    apiRequest.mockRejectedValueOnce(new ApiError(401, 'Unauthorized'))
    const { result } = renderHook(() => useTtsPlayer())
    await act(async () => {})
    await act(async () => {
      await result.current.play({ text: 'hi', lang: 'en' })
    })
    expect(result.current.error).toEqual({ code: 401, message: '请登录后重试' })
  })

  test('stop halts playback', async () => {
    apiRequest.mockResolvedValueOnce({ blob: () => Promise.resolve(new Blob()) })
    const { result } = renderHook(() => useTtsPlayer())
    await act(async () => {})
    await act(async () => {
      await result.current.play({ text: 'hi', lang: 'en' })
    })
    expect(result.current.playing).toBe(true)
    await act(() => {
      result.current.stop()
    })
    expect(pauseSpies[0]).toHaveBeenCalled()
    expect(result.current.playing).toBe(false)
  })

  test('new play pauses previous audio', async () => {
    apiRequest.mockResolvedValue({ blob: () => Promise.resolve(new Blob()) })
    const first = renderHook(() => useTtsPlayer())
    await act(async () => {})
    await act(async () => {
      await first.result.current.play({ text: 'a', lang: 'en' })
    })
    const second = renderHook(() => useTtsPlayer())
    await act(async () => {})
    await act(async () => {
      await second.result.current.play({ text: 'b', lang: 'en' })
    })
    expect(pauseSpies[0]).toHaveBeenCalled()
  })
})

