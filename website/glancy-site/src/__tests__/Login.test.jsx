/* eslint-env jest */
import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { jest } from '@jest/globals'
import { API_PATHS } from '@/config/api.js'

const mockSetUser = jest.fn()
const mockRequest = jest.fn().mockResolvedValue({ id: '1', token: 't' })
const mockNavigate = jest.fn()

jest.unstable_mockModule('@/context', () => ({
  useUser: () => ({ setUser: mockSetUser })
}))
jest.unstable_mockModule('@/hooks', () => ({
  useApi: () => ({ request: mockRequest })
}))
jest.unstable_mockModule('@/context', () => ({
  useTheme: () => ({ resolvedTheme: 'light' })
}))
jest.unstable_mockModule('react-router-dom', async () => {
  const actual = await import('react-router-dom')
  return { ...actual, useNavigate: () => mockNavigate }
})

const router = await import('react-router-dom')
const { MemoryRouter } = router
const { default: Login } = await import('@/pages/auth/Login')

test('logs in and navigates home', async () => {
  render(
    <MemoryRouter>
      <Login />
    </MemoryRouter>
  )
  fireEvent.change(screen.getByPlaceholderText('Phone number'), {
    target: { value: '1234567' }
  })
  fireEvent.change(screen.getByPlaceholderText('Password / code'), {
    target: { value: 'pass' }
  })
  fireEvent.click(screen.getByRole('button', { name: 'Continue' }))
  await waitFor(() => expect(mockRequest).toHaveBeenCalled())
  expect(mockRequest).toHaveBeenCalledWith(API_PATHS.login, expect.any(Object))
  await waitFor(() => expect(mockSetUser).toHaveBeenCalledWith({ id: '1', token: 't' }))
  expect(mockNavigate).toHaveBeenCalledWith('/')
})
