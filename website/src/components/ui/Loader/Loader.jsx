import waitingFrame1 from "@/assets/waiting-frame-1.svg";
import waitingFrame2 from "@/assets/waiting-frame-2.svg";
import waitingFrame3 from "@/assets/waiting-frame-3.svg";
import styles from "./Loader.module.css";

// 设计说明：统一声明序列帧画布尺寸，确保所有素材在等高策略下共享同一纵横比。
const WAITING_FRAME_DIMENSIONS = Object.freeze({ width: 682, height: 454 });
const WAITING_FRAMES = [waitingFrame1, waitingFrame2, waitingFrame3];

function Loader() {
  return (
    <div
      className={styles.loader}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className={styles.symbol} aria-hidden="true">
        {WAITING_FRAMES.map((frameSrc) => (
          <img
            key={frameSrc}
            className={styles.frame}
            src={frameSrc}
            alt=""
            loading="lazy"
            decoding="async"
            width={WAITING_FRAME_DIMENSIONS.width}
            height={WAITING_FRAME_DIMENSIONS.height}
          />
        ))}
      </div>
      <span className={styles.label}>Loading…</span>
    </div>
  );
}

export default Loader;
