import { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import ThemeIcon from "@/components/ui/Icon";
import MessagePopup from "@/components/ui/MessagePopup";
import Toast from "@/components/ui/Toast";
import UpgradeModal from "@/components/modals/UpgradeModal.jsx";
import { useTtsPlayer } from "@/hooks/useTtsPlayer.js";
import { useVoiceStore } from "@/store";
import { useLanguage } from "@/context";
import styles from "./TtsButton.module.css";

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
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { play, stop, loading, playing, error } = useTtsPlayer({ scope });
  const [toastMsg, setToastMsg] = useState("");
  const [popupMsg, setPopupMsg] = useState("");
  const [upgradeOpen, setUpgradeOpen] = useState(false);
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

  useEffect(() => {
    if (!error) return;
    switch (error.code) {
      case 401:
        navigate("/login");
        break;
      case 403:
        setPopupMsg(error.message);
        break;
      default:
        setToastMsg(error.message);
    }
  }, [error, navigate]);

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
      <MessagePopup
        open={!!popupMsg}
        message={popupMsg}
        onClose={() => setPopupMsg("")}
      >
        <button
          type="button"
          className={styles["upgrade-btn"]}
          onClick={() => {
            setUpgradeOpen(true);
            setPopupMsg("");
          }}
        >
          {t.upgrade}
        </button>
      </MessagePopup>
      <UpgradeModal open={upgradeOpen} onClose={() => setUpgradeOpen(false)} />
      <Toast
        open={!!toastMsg}
        message={toastMsg}
        onClose={() => setToastMsg("")}
      />
    </>
  );
}
