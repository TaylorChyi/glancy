import { useRef, useState, useEffect, useCallback } from 'react'
import { useApi } from '@/hooks/useApi.js'
import { ApiError } from '@/api/client.js'

/**
 * Hook that encapsulates TTS playback logic with cache-first strategy.
 * It first tries a shortcut request which may return 204 when cache misses.
 * In that case it retries without shortcut and plays the resulting audio.
 */
export function useTtsPlayer({ scope = 'word' } = {}) {
  const api = useApi()
  const tts = api.tts
  const audioRef = useRef(typeof Audio !== 'undefined' ? new Audio() : null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [playing, setPlaying] = useState(false)

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    const handleEnd = () => setPlaying(false)
    audio.addEventListener('ended', handleEnd)
    return () => audio.removeEventListener('ended', handleEnd)
  }, [])

  const fetchAudio = useCallback(
    async (payload) => {
      const fn = scope === 'sentence' ? tts.speakSentence : tts.speakWord
      let resp = await fn({ ...payload, shortcut: true })
      if (resp instanceof Response && resp.status === 204) {
        resp = await fn({ ...payload, shortcut: false })
      }
      return resp instanceof Response ? await resp.json() : resp
    },
    [tts, scope],
  )

  const play = useCallback(
    async ({ text, lang, voice, speed = 1.0, format = 'mp3' }) => {
      if (!text || !lang) return
      setLoading(true)
      setError(null)
      try {
        const data = await fetchAudio({ text, lang, voice, speed, format })
        const audio = audioRef.current
        if (audio) {
          audio.src = data.url
          await audio.play()
          setPlaying(true)
        }
      } catch (err) {
        if (err instanceof ApiError) {
          switch (err.status) {
            case 401:
              setError('请登录后重试')
              break
            case 403:
              setError('升级以继续使用或切换可用音色')
              break
            case 429: {
              const retry = err.headers?.get('Retry-After')
              setError(`请求过于频繁，请在${retry || '稍后'}秒后重试`)
              break
            }
            case 424:
            case 503:
              setError('服务繁忙，请稍后再试')
              break
            default:
              setError(err.message)
          }
        } else {
          setError('网络错误')
        }
      } finally {
        setLoading(false)
      }
    },
    [fetchAudio],
  )

  return { play, audio: audioRef.current, loading, error, playing }
}
