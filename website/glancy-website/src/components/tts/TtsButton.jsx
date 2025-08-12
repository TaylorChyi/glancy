import { useMemo } from 'react'
import ThemeIcon from '@/components/ui/Icon'
import { useTtsPlayer } from '@/hooks/useTtsPlayer.js'
import { useVoiceStore } from '@/store'
import styles from './TtsButton.module.css'

/**
 * Unified TTS play button for words and sentences.
 * Handles loading/playing states and stops playback on second click.
 */
export default function TtsButton({
  text,
  lang,
  voice,
  scope = 'word',
  size,
  disabled = false,
}) {
  const { play, stop, loading, playing } = useTtsPlayer({ scope })
  const tooltip = useMemo(
    () => (scope === 'sentence' ? '播放例句发音' : '播放发音'),
    [scope],
  )

  const handleClick = async () => {
    if (disabled || loading) return
    if (playing) {
      stop()
      return
    }
    const selectedVoice = voice ?? useVoiceStore.getState().getVoice(lang)
    await play({ text, lang, voice: selectedVoice })
  }

  const btnClass = [
    styles.button,
    playing && styles.playing,
    loading && styles.loading,
    disabled && styles.disabled,
  ]
    .filter(Boolean)
    .join(' ')

  const iconSize = size || (scope === 'sentence' ? 24 : 20)

  return (
    <button
      type="button"
      className={btnClass}
      onClick={handleClick}
      disabled={disabled || loading}
      aria-label={tooltip}
      title={tooltip}
    >
      <ThemeIcon name="voice-button" width={iconSize} height={iconSize} />
    </button>
  )
}
