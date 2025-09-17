import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import MessagePopup from "@/components/ui/MessagePopup";
import Toast from "@/components/ui/Toast";
import UpgradeModal from "@/components/modals/UpgradeModal.jsx";
import { useTtsPlayer } from "@/hooks/useTtsPlayer.js";
import { useVoiceStore } from "@/store";
import { useLanguage } from "@/context";
import styles from "./PronounceableWord.module.css";

/**
 * Text element that plays word pronunciation when clicked.
 * Mirrors error handling of TtsButton for consistent UX.
 */
export default function PronounceableWord({ text, lang, className }) {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { play, stop, loading, playing, error } = useTtsPlayer({
    scope: "word",
  });
  const [toastMsg, setToastMsg] = useState("");
  const [popupMsg, setPopupMsg] = useState("");
  const [upgradeOpen, setUpgradeOpen] = useState(false);

  const handleClick = async () => {
    if (loading) return;
    if (playing) {
      stop();
      return;
    }
    const voice = useVoiceStore.getState().getVoice(lang);
    await play({ text, lang, voice });
  };

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

  const cls = [
    styles.word,
    playing && styles.playing,
    loading && styles.loading,
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <>
      <span
        role="button"
        tabIndex={0}
        className={cls}
        onClick={handleClick}
        onKeyDown={(e) => e.key === "Enter" && handleClick()}
        aria-label={t.playWordAudio}
      >
        {text}
      </span>
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
