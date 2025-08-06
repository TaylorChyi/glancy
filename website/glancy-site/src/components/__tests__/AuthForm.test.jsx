/* eslint-env jest */
import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { jest } from '@jest/globals'

jest.unstable_mockModule('@/context', () => ({
  useTheme: () => ({ resolvedTheme: 'light' })
}))

jest.unstable_mockModule('@/context', () => ({
  useLanguage: () => ({
    t: {
      continueButton: 'Continue',
      invalidAccount: 'Invalid account',
      loginButton: 'Log in',
      registerButton: 'Sign up',
      or: 'OR',
      notImplementedYet: 'Not implemented yet',
      termsOfUse: 'Terms of Use',
      privacyPolicy: 'Privacy Policy'
    }
  })
}))

const { default: AuthForm } = await import('@/components/form/AuthForm.jsx')

describe('AuthForm', () => {
  test('submits valid credentials', async () => {
    const handleSubmit = jest.fn().mockResolvedValue(undefined)
    const { asFragment } = render(
      <MemoryRouter>
        <AuthForm
          title="Login"
          switchText="Have account?"
          switchLink="/register"
          onSubmit={handleSubmit}
          placeholders={{ username: 'Username' }}
          formMethods={['username']}
          methodOrder={['username']}
        />
      </MemoryRouter>
    )
    fireEvent.change(screen.getByPlaceholderText('Username'), {
      target: { value: 'alice' }
    })
    fireEvent.change(screen.getByPlaceholderText('Password'), {
      target: { value: 'secret' }
    })
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }))
    await waitFor(() =>
      expect(handleSubmit).toHaveBeenCalledWith({
        account: 'alice',
        password: 'secret',
        method: 'username'
      })
    )
    expect(asFragment()).toMatchSnapshot()
  })

  test('shows error when validation fails', async () => {
    const handleSubmit = jest.fn()
    const validateAccount = () => false
    render(
      <MemoryRouter>
        <AuthForm
          title="Login"
          switchText="Have account?"
          switchLink="/register"
          onSubmit={handleSubmit}
          placeholders={{ username: 'Username' }}
          formMethods={['username']}
          methodOrder={['username']}
          validateAccount={validateAccount}
        />
      </MemoryRouter>
    )
    fireEvent.change(screen.getByPlaceholderText('Username'), {
      target: { value: '' }
    })
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }))
    expect(await screen.findByText('Invalid account')).toBeInTheDocument()
  })
})
