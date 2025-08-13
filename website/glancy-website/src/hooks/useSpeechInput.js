import { useCallback } from 'react'

/**
 * Hook to capture speech input using the Web Speech API.
 * It invokes the provided callback with the recognised text.
 *
 * @param {Object} opts
 * @param {(text: string) => void} [opts.onResult] callback when speech is transcribed
 */
export default function useSpeechInput({ onResult } = {}) {
  const start = useCallback(
    (language = 'en-US') => {
      const SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition
      if (!SpeechRecognition) return
      const recognition = new SpeechRecognition()
      recognition.lang = language
      recognition.interimResults = false
      recognition.maxAlternatives = 1
      recognition.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map((r) => r[0]?.transcript)
          .join('')
        if (transcript && onResult) onResult(transcript)
      }
      recognition.start()
    },
    [onResult],
  )

  return { start }
}
