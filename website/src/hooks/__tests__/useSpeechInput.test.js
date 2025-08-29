/* eslint-env jest */
import { renderHook, act } from '@testing-library/react'
import { jest } from '@jest/globals'
import useSpeechInput from '../useSpeechInput.js'

const recognitionMock = {
  start: jest.fn(),
  lang: '',
  interimResults: false,
  maxAlternatives: 1,
  onresult: null,
}

global.webkitSpeechRecognition = function () {
  return recognitionMock
}

describe('useSpeechInput', () => {
  afterEach(() => {
    recognitionMock.start.mockClear()
    recognitionMock.onresult = null
  })

  afterAll(() => {
    delete global.webkitSpeechRecognition
  })

  test('invokes SpeechRecognition and callback', () => {
    const onResult = jest.fn()
    const { result } = renderHook(() => useSpeechInput({ onResult }))

    act(() => {
      result.current.start('en-US')
    })

    expect(recognitionMock.start).toHaveBeenCalled()

    const event = { results: [[{ transcript: 'hello' }]] }
    act(() => {
      recognitionMock.onresult(event)
    })
    expect(onResult).toHaveBeenCalledWith('hello')
  })
})
