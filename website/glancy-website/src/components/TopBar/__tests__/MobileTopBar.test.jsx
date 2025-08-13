/* eslint-env jest */
import React from 'react'
import { render } from '@testing-library/react'
import { jest } from '@jest/globals'

// mock TtsButton to isolate top bar behaviour
const TtsButton = jest.fn(() => <div data-testid="tts" />)

jest.unstable_mockModule('@/components', () => ({ TtsButton }))

const { default: MobileTopBar } = await import('@/components/TopBar/MobileTopBar.jsx')

describe('MobileTopBar', () => {
  afterEach(() => {
    TtsButton.mockClear()
  })

  /**
   * Renders play button when a term is provided.
   */
  test('renders tts button for term', () => {
    render(<MobileTopBar term="world" lang="en" />)
    expect(TtsButton).toHaveBeenCalledWith(
      expect.objectContaining({ text: 'world', lang: 'en', size: 20 }),
      {}
    )
  })

  /**
   * Omits play button when term is empty.
   */
  test('hides tts button without term', () => {
    render(<MobileTopBar term="" lang="en" />)
    expect(TtsButton).not.toHaveBeenCalled()
  })
})
