import { useEffect, useState } from 'react'
import { useApi } from '@/hooks'
import { useUserStore } from '@/store/userStore.ts'
import styles from './VoiceSelector.module.css'

/**
 * Dropdown for selecting available voices for a given language.
 * Voices requiring Pro plan are disabled for non-pro users.
 */
export default function VoiceSelector({ lang, value, onChange }) {
  const api = useApi()
  const user = useUserStore((s) => s.user)
  const [voices, setVoices] = useState([])

  useEffect(() => {
    let cancelled = false
    if (!lang) return
    api.tts
      .fetchVoices({ lang })
      .then((list) => {
        if (!cancelled) setVoices(list)
      })
      .catch((err) => console.error(err))
    return () => {
      cancelled = true
    }
  }, [lang, api])

  const isPro = !!(user?.member || user?.isPro || (user?.plan && user.plan !== 'free'))

  return (
    <select className={styles.select} value={value} onChange={(e) => onChange?.(e.target.value)}>
      {voices.map((v) => (
        <option
          key={v.id}
          value={v.id}
          disabled={v.plan === 'pro' && !isPro}
          className={!isPro && v.plan === 'pro' ? styles.disabled : undefined}
        >
          {v.label}
        </option>
      ))}
    </select>
  )
}
