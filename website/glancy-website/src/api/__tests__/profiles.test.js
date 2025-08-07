import { createProfilesApi } from '@/api/profiles.js'
import { API_PATHS } from '@/config/api.js'
import { jest } from '@jest/globals'

test('fetchProfile calls correct path', async () => {
  const request = jest.fn().mockResolvedValue({})
  const api = createProfilesApi(request)
  await api.fetchProfile({ userId: '1', token: 't' })
  expect(request).toHaveBeenCalledWith(`${API_PATHS.profiles}/user/1`, { token: 't' })
})

test('saveProfile posts profile data', async () => {
  const request = jest.fn().mockResolvedValue({})
  const api = createProfilesApi(request)
  await api.saveProfile({ userId: '1', token: 't', profile: { a: 1 } })
  expect(request.mock.calls[0][0]).toBe(`${API_PATHS.profiles}/user/1`)
  expect(request.mock.calls[0][1]).toMatchObject({ method: 'POST', token: 't' })
})
