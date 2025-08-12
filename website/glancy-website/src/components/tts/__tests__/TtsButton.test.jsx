/* eslint-env jest */
import React from 'react'
import { render, fireEvent } from '@testing-library/react'
import { jest } from '@jest/globals'

// mock hooks and icon to isolate button behavior
const play = jest.fn()
const stop = jest.fn()
const useTtsPlayer = jest.fn(() => ({
  play,
  stop,
  loading: false,
  playing: false,
}))

jest.unstable_mockModule('@/hooks/useTtsPlayer.js', () => ({ useTtsPlayer }))

jest.unstable_mockModule('@/components/ui/Icon', () => ({
  __esModule: true,
  default: () => <span data-testid="icon" />,
}))

const { default: TtsButton } = await import('@/components/tts/TtsButton.jsx')

describe('TtsButton', () => {
  afterEach(() => {
    play.mockReset()
    stop.mockReset()
    useTtsPlayer.mockClear()
  })

  /**
   * Renders button and verifies clicking triggers play with correct params.
   */
  test('invokes play with text and lang', () => {
    const { getByRole } = render(<TtsButton text="hello" lang="en" />)
    fireEvent.click(getByRole('button'))
    expect(play).toHaveBeenCalledWith({ text: 'hello', lang: 'en', voice: undefined })
  })

  /**
   * When already playing, clicking triggers stop instead of play.
   */
  test('stops when playing', () => {
    useTtsPlayer.mockReturnValueOnce({ play, stop, loading: false, playing: true })
    const { getByRole } = render(<TtsButton text="hi" lang="en" />)
    fireEvent.click(getByRole('button'))
    expect(stop).toHaveBeenCalled()
    expect(play).not.toHaveBeenCalled()
  })
})
