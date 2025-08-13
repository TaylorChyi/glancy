import { useRef, useState, useEffect, useCallback } from 'react'
import { ApiError, apiRequest } from '@/api/client.js'
import { API_PATHS } from '@/config/api.js'
import { audioManager } from '@/utils/audioManager.js'

/* global process */

/**
 * Hook that streams TTS audio through backend endpoints. It builds a query
 * to either the word or sentence audio route and handles playback lifecycle
 * including error reporting and resource cleanup.
 */
export function useTtsPlayer({ scope = 'word' } = {}) {
  const audioRef = useRef(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [playing, setPlaying] = useState(false)

  useEffect(() => {
    if (typeof Audio === 'undefined') return
    const audio = new Audio()
    if (audio.style) audio.style.display = 'none'
    if (typeof document !== 'undefined' && audio instanceof HTMLElement) {
      document.body.appendChild(audio)
    }
    audioRef.current = audio

    const handlePause = () => setPlaying(false)
    const handleEnd = () => {
      setPlaying(false)
      audioManager.stop(audio)
    }
    audio.addEventListener('pause', handlePause)
    audio.addEventListener('ended', handleEnd)

    return () => {
      audio.removeEventListener('pause', handlePause)
      audio.removeEventListener('ended', handleEnd)
      audioManager.stop(audio)
      if (typeof document !== 'undefined' && audio instanceof HTMLElement) {
        document.body.removeChild(audio)
      }
    }
  }, [])

  const play = useCallback(
    async ({ text, lang, voice, speed = 1.0, format = 'mp3' }) => {
      if (!text || !lang) return
      setLoading(true)
      setError(null)
      try {
        const isDev =
          (typeof process !== 'undefined' && process.env.NODE_ENV !== 'production') ||
          (typeof import.meta !== 'undefined' && import.meta.env?.MODE !== 'production')
        const base = scope === 'sentence' ? API_PATHS.ttsSentence : API_PATHS.ttsWord
        const params = new URLSearchParams({ text, lang, format, speed })
        if (voice) params.set('voice', voice)
        const url = `${base}/audio?${params.toString()}`
        if (isDev) {
          console.info('TTS play request', { scope, url })
        }
        const resp = await apiRequest(url)
        const blob = await resp.blob()
        const audio = audioRef.current
        if (audio) {
          if (audio.src && audio.src.startsWith('blob:')) URL.revokeObjectURL(audio.src)
          audio.src = URL.createObjectURL(blob)
          await audioManager.play(audio)
          setPlaying(true)
          if (isDev) {
            console.info('TTS play started', { url })
          }
        }
      } catch (err) {
        const isDev =
          (typeof process !== 'undefined' && process.env.NODE_ENV !== 'production') ||
          (typeof import.meta !== 'undefined' && import.meta.env?.MODE !== 'production')
        if (isDev) {
          console.warn('TTS play failed', err)
        }
        if (err instanceof ApiError) {
          switch (err.status) {
            case 401:
              setError({ code: 401, message: '请登录后重试' })
              break
            case 403:
              setError({ code: 403, message: '升级以继续使用或切换可用音色' })
              break
            case 429: {
              const retry = err.headers?.get('Retry-After')
              setError({
                code: 429,
                message: `请求过于频繁，请在${retry || '稍后'}秒后重试`,
              })
              break
            }
            case 424:
            case 503:
              setError({ code: err.status, message: '服务繁忙，请稍后再试' })
              break
            default:
              setError({ code: err.status, message: err.message })
          }
        } else {
          setError({ code: 0, message: '网络错误' })
        }
      } finally {
        setLoading(false)
      }
    },
    [scope],
  )

  const stop = useCallback(() => {
    const audio = audioRef.current
    if (!audio) return
    if (audio.src && audio.src.startsWith('blob:')) {
      URL.revokeObjectURL(audio.src)
      audio.src = ''
    }
    audioManager.stop(audio)
    setPlaying(false)
  }, [])

  return { play, stop, loading, error, playing }
}
