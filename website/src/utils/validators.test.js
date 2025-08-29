/* eslint-env jest */
import { validateEmail, validatePhone, validateAccount } from '@/utils/validators.js'

describe('validateEmail', () => {
  it('validates email format', () => {
    expect(validateEmail('test@example.com')).toBe(true)
    expect(validateEmail('invalid-email')).toBe(false)
  })
})

describe('validatePhone', () => {
  it('validates phone numbers', () => {
    expect(validatePhone('+12345678901')).toBe(true)
    expect(validatePhone('12345')).toBe(false)
  })
})

describe('validateAccount', () => {
  it('handles email method', () => {
    expect(validateAccount('test@example.com', 'email')).toBe(true)
    expect(validateAccount('bademail', 'email')).toBe(false)
  })

  it('handles phone method', () => {
    expect(validateAccount('+12345678901', 'phone')).toBe(true)
    expect(validateAccount('12345', 'phone')).toBe(false)
  })

  it('defaults to true for other methods', () => {
    expect(validateAccount('anything', 'username')).toBe(true)
  })
})
