import { useTtsPlayer } from "@shared/hooks/useTtsPlayer.js";
import { useVoiceStore } from "@core/store";
import { useLanguage } from "@core/context";
import styles from "./PronounceableWord.module.css";
import useTtsFeedback from "./useTtsFeedback.js";
import TtsFeedbackSurfaces from "./TtsFeedbackSurfaces.jsx";

const buildPronounceableWordClassName = ({ className, playing, loading }) =>
  [styles.word, playing && styles.playing, loading && styles.loading, className]
    .filter(Boolean)
    .join(" ");

const pronounceableWordClick = async ({ loading, playing, stop, play, lang, text }) => {
  if (loading) return;
  if (playing) {
    stop();
    return;
  }
  const voice = useVoiceStore.getState().getVoice(lang);
  await play({ text, lang, voice });
};

export default function PronounceableWord({ text, lang, className }) {
  const { t } = useLanguage();
  const { play, stop, loading, playing, error } = useTtsPlayer({ scope: "word" });
  const feedback = useTtsFeedback(error);
  const handleClick = () => pronounceableWordClick({ loading, playing, stop, play, lang, text });
  const cls = buildPronounceableWordClassName({ className, loading, playing });

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
      <TtsFeedbackSurfaces
        feedback={feedback}
        upgradeLabel={t.upgrade}
        upgradeButtonClassName={styles["upgrade-btn"]}
      />
    </>
  );
}
