import { API_PATHS } from '@/config/api.js'
import { apiRequest, createJsonRequest } from './client.js'
import { useApi } from '@/hooks'

export function createSearchRecordsApi(request = apiRequest) {
  const jsonRequest = createJsonRequest(request)
  const fetchSearchRecords = ({ userId, token }) =>
    request(`${API_PATHS.searchRecords}/user/${userId}`, { token })

  const saveSearchRecord = ({ userId, token, term, language }) =>
    jsonRequest(`${API_PATHS.searchRecords}/user/${userId}`, {
      method: 'POST',
      token,
      body: { term, language }
    })

  const clearSearchRecords = ({ userId, token }) =>
    request(`${API_PATHS.searchRecords}/user/${userId}`, {
      method: 'DELETE',
      token
    })

  const deleteSearchRecord = ({ userId, recordId, token }) =>
    request(`${API_PATHS.searchRecords}/user/${userId}/${recordId}`, {
      method: 'DELETE',
      token
    })

  const favoriteSearchRecord = ({ userId, token, recordId }) =>
    request(
      `${API_PATHS.searchRecords}/user/${userId}/${recordId}/favorite`,
      {
        method: 'POST',
        token
      }
    )

  const unfavoriteSearchRecord = ({ userId, token, recordId }) =>
    request(
      `${API_PATHS.searchRecords}/user/${userId}/${recordId}/favorite`,
      {
        method: 'DELETE',
        token
      }
    )

  return {
    fetchSearchRecords,
    saveSearchRecord,
    clearSearchRecords,
    deleteSearchRecord,
    favoriteSearchRecord,
    unfavoriteSearchRecord
  }
}

export const {
  fetchSearchRecords,
  saveSearchRecord,
  clearSearchRecords,
  deleteSearchRecord,
  favoriteSearchRecord,
  unfavoriteSearchRecord
} = createSearchRecordsApi()

export function useSearchRecordsApi() {
  return useApi().searchRecords
}
