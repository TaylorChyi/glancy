import { useTtsPlayer } from "@shared/hooks/useTtsPlayer.js";
import { useVoiceStore } from "@core/store";
import { useLanguage } from "@core/context";
import styles from "./PronounceableWord.module.css";
import useTtsFeedback from "./useTtsFeedback.js";
import TtsFeedbackSurfaces from "./TtsFeedbackSurfaces.jsx";

/**
 * 背景：
 *  - 与 TtsButton 保持一致的错误反馈体验，但展示触点是可点击文字。
 * 目的：
 *  - 复用 useTtsFeedback + TtsFeedbackSurfaces，避免在此重复弹层渲染逻辑。
 * 关键决策：
 *  - 控制层只负责触发播放/停止，反馈完全交给组合组件处理，
 *    维持“触发器 + 反馈”分离的结构，后续可平移到其他文本元素。
 */
export default function PronounceableWord({ text, lang, className }) {
  const { t } = useLanguage();
  const { play, stop, loading, playing, error } = useTtsPlayer({
    scope: "word",
  });
  const feedback = useTtsFeedback(error);

  const handleClick = async () => {
    if (loading) return;
    if (playing) {
      stop();
      return;
    }
    const voice = useVoiceStore.getState().getVoice(lang);
    await play({ text, lang, voice });
  };

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
      <TtsFeedbackSurfaces
        feedback={feedback}
        upgradeLabel={t.upgrade}
        upgradeButtonClassName={styles["upgrade-btn"]}
      />
    </>
  );
}
