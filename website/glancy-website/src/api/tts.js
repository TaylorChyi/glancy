import { API_PATHS } from '@/config/api.js'
import { apiRequest } from './client.js'

/**
 * Create TTS API helpers.
 * Each method returns the raw fetch response or parsed JSON depending on
 * content type, allowing callers to handle 204 responses gracefully.
 */
export function createTtsApi(request = apiRequest) {
  const post = (path, body) =>
    request(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    })

  const speakWord = (body) => post(API_PATHS.ttsWord, body)
  const speakSentence = (body) => post(API_PATHS.ttsSentence, body)
  const fetchVoices = ({ lang }) => request(`${API_PATHS.ttsVoices}?lang=${encodeURIComponent(lang)}`)

  return { speakWord, speakSentence, fetchVoices }
}

export const { speakWord, speakSentence, fetchVoices } = createTtsApi(
)
