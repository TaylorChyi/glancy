import { createWordsApi } from '@/api/words.js'
import { API_PATHS } from '@/config/api.js'
import { jest } from '@jest/globals'

test('fetchWord builds query string', async () => {
  const request = jest.fn().mockResolvedValue({})
  const api = createWordsApi(request)
  await api.fetchWord({ userId: 'u', term: 'hello', language: 'ENGLISH', model: 'M1', token: 't' })
  const [url, opts] = request.mock.calls[0]
  expect(url).toBe(`${API_PATHS.words}?userId=u&term=hello&language=ENGLISH&model=M1`)
  expect(opts.token).toBe('t')
})
