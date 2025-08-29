import { API_PATHS } from '@/config/api.js'
import { apiRequest } from './client.js'
import { useApi } from '@/hooks'

export function createUsersApi(request = apiRequest) {
  const uploadAvatar = async ({ userId, file, token }) => {
    const formData = new FormData()
    formData.append('file', file)
    return request(`${API_PATHS.users}/${userId}/avatar-file`, {
      method: 'POST',
      body: formData,
      token
    })
  }

  return { uploadAvatar }
}

export const { uploadAvatar } = createUsersApi()

export function useUsersApi() {
  return useApi().users
}
