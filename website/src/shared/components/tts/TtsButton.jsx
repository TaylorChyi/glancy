import { useMemo, useCallback } from "react";
import ThemeIcon from "@shared/components/ui/Icon";
import { useTtsPlayer } from "@shared/hooks/useTtsPlayer.js";
import { useVoiceStore } from "@core/store";
import { useLanguage } from "@core/context";
import styles from "./TtsButton.module.css";
import useTtsFeedback from "./useTtsFeedback.js";
import TtsFeedbackSurfaces from "./TtsFeedbackSurfaces.jsx";

const useTooltipText = (scope, t) =>
  useMemo(
    () => (scope === "sentence" ? t.playSentenceAudio : t.playWordAudio),
    [scope, t],
  );

const useButtonClass = (disabled, loading, playing) =>
  useMemo(
    () =>
      [
        styles.button,
        playing && styles.playing,
        loading && styles.loading,
        disabled && styles.disabled,
      ]
        .filter(Boolean)
        .join(" "),
    [disabled, loading, playing],
  );

function useHandleClick({ disabled, loading, playing, stop, play, text, lang, voice }) {
  return useCallback(async () => {
    if (disabled || loading) return;
    if (playing) {
      stop();
      return;
    }
    const selectedVoice = voice ?? useVoiceStore.getState().getVoice(lang);
    await play({ text, lang, voice: selectedVoice });
  }, [disabled, loading, playing, stop, play, text, lang, voice]);
}

/**
 * Unified TTS play button for words and sentences.
 * Handles loading/playing states and stops playback on second click.
 */
function useTtsButtonState({
  text,
  lang,
  voice,
  scope = "word",
  size,
  disabled = false,
}) {
  const { t } = useLanguage();
  const { play, stop, loading, playing, error } = useTtsPlayer({ scope });
  const handleClick = useHandleClick({ disabled, loading, playing, stop, play, text, lang, voice });
  const tooltip = useTooltipText(scope, t),
    btnClass = useButtonClass(disabled, loading, playing),
    iconSize = size || (scope === "sentence" ? 24 : 20),
    feedback = useTtsFeedback(error);

  return {
    tooltip,
    handleClick,
    btnClass,
    iconSize,
    feedback,
    loading,
    t,
  };
}

export default function TtsButton(props) {
  const { tooltip, handleClick, btnClass, iconSize, feedback, loading, t } =
    useTtsButtonState(props);
  const { disabled = false } = props;

  return (
    <>
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
      <TtsFeedbackSurfaces
        feedback={feedback}
        upgradeLabel={t.upgrade}
        upgradeButtonClassName={styles["upgrade-btn"]}
      />
    </>
  );
}
