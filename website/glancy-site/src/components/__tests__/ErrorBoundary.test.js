import { render, screen } from '@testing-library/react'
import { jest } from '@jest/globals'
import ErrorBoundary from '@/components/ui/ErrorBoundary'
import React from 'react'

function ProblemChild() {
  throw new Error('boom')
}

beforeEach(() => {
  jest.spyOn(console, 'error').mockImplementation(() => {})
})

afterEach(() => {
  console.error.mockRestore()
})

test('displays fallback UI on error', () => {
  const { asFragment } = render(
    <ErrorBoundary fallback={<div>Fallback</div>}>
      <ProblemChild />
    </ErrorBoundary>
  )
  expect(screen.getByText('Fallback')).toBeInTheDocument()
  expect(asFragment()).toMatchSnapshot()
})
