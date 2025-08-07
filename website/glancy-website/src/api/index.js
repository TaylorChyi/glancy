import { createApiClient, createJsonRequest } from './client.js'
import { createChatApi } from './chat.js'
import { createWordsApi } from './words.js'
import { createLocaleApi } from './locale.js'
import { createSearchRecordsApi } from './searchRecords.js'
import { createUsersApi } from './users.js'
import { createProfilesApi } from './profiles.js'
import { createLlmApi } from './llm.js'

export function createApi(config) {
  const request = createApiClient(config)
  const jsonRequest = createJsonRequest(request)
  return {
    request,
    jsonRequest,
    chat: createChatApi(request),
    words: createWordsApi(request),
    locale: createLocaleApi(request),
    searchRecords: createSearchRecordsApi(request),
    users: createUsersApi(request),
    profiles: createProfilesApi(request),
    llm: createLlmApi(request)
  }
}

const api = createApi()
export default api
