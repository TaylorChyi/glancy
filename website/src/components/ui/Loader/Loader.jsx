import waitingFrame1 from "@/assets/waiting-frame-1.svg";
import waitingFrame2 from "@/assets/waiting-frame-2.svg";
import waitingFrame3 from "@/assets/waiting-frame-3.svg";
import styles from "./Loader.module.css";

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
          />
        ))}
      </div>
      <span className={styles.label}>Loading…</span>
    </div>
  );
}

export default Loader;
