import { createLlmApi } from '@/api/llm.js'
import { API_PATHS } from '@/config/api.js'
import { jest } from '@jest/globals'

test('fetchModels hits llm models endpoint', async () => {
  const request = jest.fn().mockResolvedValue(['a'])
  const api = createLlmApi(request)
  const result = await api.fetchModels()
  expect(request).toHaveBeenCalledWith(API_PATHS.llmModels)
  expect(result).toEqual(['a'])
})
