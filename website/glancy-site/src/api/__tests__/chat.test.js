import { createChatApi } from '@/api/chat.js'
import { API_PATHS } from '@/config/api.js'
import { jest } from '@jest/globals'

test('sendChatMessage posts to chat endpoint', async () => {
  const request = jest.fn().mockResolvedValue('ok')
  const api = createChatApi(request)
  await api.sendChatMessage('hi')
  expect(request).toHaveBeenCalledWith(API_PATHS.chat, expect.objectContaining({
    method: 'POST'
  }))
})
