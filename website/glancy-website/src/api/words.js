import { API_PATHS } from '@/config/api.js'
import { apiRequest } from './client.js'
import { useApi } from '@/hooks'

/**
 * Query a word definition
 * @param {Object} opts
 * @param {string} opts.userId user identifier
 * @param {string} opts.term word to search
 * @param {string} opts.language CHINESE or ENGLISH
 * @param {string} [opts.token] user token for auth header
 */
export function createWordsApi(request = apiRequest) {
  const fetchWord = async ({ userId, term, language, model, token }) => {
    const params = new URLSearchParams({ userId, term, language })
    if (model) params.append('model', model)
    return request(`${API_PATHS.words}?${params.toString()}`, { token })
  }

  const fetchWordAudio = async ({ userId, term, language }) => {
    const params = new URLSearchParams({ userId, term, language })
    const resp = await request(`${API_PATHS.words}/audio?${params.toString()}`)
    return resp.blob()
  }

  return { fetchWord, fetchWordAudio }
}

export const { fetchWord, fetchWordAudio } = createWordsApi()

export function useWordsApi() {
  return useApi().words
}
