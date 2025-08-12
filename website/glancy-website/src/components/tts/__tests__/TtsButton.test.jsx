/* eslint-env jest */
import React from 'react'
import { render, fireEvent } from '@testing-library/react'
import { jest } from '@jest/globals'

// mock hooks and icon to isolate button behavior
const play = jest.fn()

jest.unstable_mockModule('@/hooks/useTtsPlayer.js', () => ({
  useTtsPlayer: () => ({ play, audio: {}, loading: false, playing: false }),
}))

jest.unstable_mockModule('@/components/ui/Icon', () => ({
  __esModule: true,
  default: () => <span data-testid="icon" />,
}))

const { default: TtsButton } = await import('@/components/tts/TtsButton.jsx')

describe('TtsButton', () => {
  /**
   * Renders button and verifies clicking triggers play with correct params.
   */
  test('invokes play with text and lang', () => {
    const { getByRole } = render(<TtsButton text="hello" lang="en" />)
    fireEvent.click(getByRole('button'))
    expect(play).toHaveBeenCalledWith({ text: 'hello', lang: 'en', voice: undefined })
  })
})
