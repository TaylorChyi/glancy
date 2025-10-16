import { useMemo } from "react";
import ThemeIcon from "@shared/components/ui/Icon";
import { ICON_TOKEN } from "@assets/iconTokens";
import { useTtsPlayer } from "@shared/hooks/useTtsPlayer.js";
import { useVoiceStore } from "@core/store";
import { useLanguage } from "@core/context";
import styles from "./TtsButton.module.css";
import useTtsFeedback from "./useTtsFeedback.js";
import TtsFeedbackSurfaces from "./TtsFeedbackSurfaces.jsx";

/**
 * Unified TTS play button for words and sentences.
 * Handles loading/playing states and stops playback on second click.
 */
export default function TtsButton({
  text,
  lang,
  voice,
  scope = "word",
  size,
  disabled = false,
}) {
  const { t } = useLanguage();
  const { play, stop, loading, playing, error } = useTtsPlayer({ scope });
  const feedback = useTtsFeedback(error);
  const tooltip = useMemo(
    () => (scope === "sentence" ? t.playSentenceAudio : t.playWordAudio),
    [scope, t],
  );

  const handleClick = async () => {
    if (disabled || loading) return;
    if (playing) {
      stop();
      return;
    }
    const selectedVoice = voice ?? useVoiceStore.getState().getVoice(lang);
    await play({ text, lang, voice: selectedVoice });
  };

  //
  // 背景：
  //  - UI 仅展示裸图标，按钮配色由 CSS 模块依据语义类自洽计算，逻辑层只负责组合基础状态。
  // 取舍：
  //  - 保留 playing/loading/disabled 类用于覆盖色彩，其余语义交由样式统一治理。
  const btnClass = [
    styles.button,
    playing && styles.playing,
    loading && styles.loading,
    disabled && styles.disabled,
  ]
    .filter(Boolean)
    .join(" ");

  const iconSize = size || (scope === "sentence" ? 24 : 20);

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
        <ThemeIcon
          name={ICON_TOKEN.CHAT_VOICE}
          width={iconSize}
          height={iconSize}
        />
      </button>
      <TtsFeedbackSurfaces
        feedback={feedback}
        upgradeLabel={t.upgrade}
        upgradeButtonClassName={styles["upgrade-btn"]}
      />
    </>
  );
}
