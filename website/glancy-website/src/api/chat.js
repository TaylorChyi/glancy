import { API_PATHS } from '@/config/api.js'
import { apiRequest, createJsonRequest } from './client.js'
import { useApi } from '@/hooks'

export function createChatApi(request = apiRequest) {
  const jsonRequest = createJsonRequest(request)
  const sendChatMessage = (text) =>
    jsonRequest(API_PATHS.chat, {
      method: 'POST',
      body: { text }
    })

  return { sendChatMessage }
}

export const { sendChatMessage } = createChatApi()

export function useChatApi() {
  return useApi().chat
}
