import { useMemo } from "react";
import waittingFrame from "@assets/interface/controls/waitting-frame.svg";
import styles from "./Loader.module.css";
import waitingAnimationStrategy from "./waitingAnimationStrategy.cjs";
import useWaitingFrameCycle from "./useWaitingFrameCycle";
import useFrameReveal from "./useFrameReveal";
import frameVisibilityClassName from "./frameVisibilityClassName";
import { deriveRevealTiming } from "./waitingRevealStrategy";
import { buildWaitingSymbolStyle } from "./waitingSymbolStyle";


const WAITING_ANIMATION_STRATEGY = waitingAnimationStrategy;

const WAITING_FRAME_DIMENSIONS = WAITING_ANIMATION_STRATEGY.canvas;
const WAITING_FRAMES = Object.freeze([waittingFrame]);
// 设计说明：单帧素材默认不触发调度，依赖 Hook 内的 shouldSchedule 控制节奏。
const WAITING_CYCLE_OPTIONS = Object.freeze({
  shouldSchedule: WAITING_FRAMES.length > 1,
});
const WAITING_FRAME_IMAGE_VALUE = `url("${waittingFrame}")`;

function useWaitingSymbolStyle(durationMs) {
  return useMemo(
    () =>
      buildWaitingSymbolStyle(
        WAITING_FRAME_DIMENSIONS,
        durationMs,
        WAITING_FRAME_IMAGE_VALUE,
      ),
    [durationMs],
  );
}

function Loader() {
  const { currentFrame, cycleDurationMs } = useWaitingFrameCycle(
    WAITING_FRAMES,
    WAITING_CYCLE_OPTIONS,
  );
  const { intervalMs: fadeIntervalMs, durationMs: fadeDurationMs } = deriveRevealTiming(cycleDurationMs);
  const isRevealed = useFrameReveal(currentFrame, { intervalMs: fadeIntervalMs });
  const waitingSymbolStyle = useWaitingSymbolStyle(fadeDurationMs);
  return (
    <div className={styles.loader} role="status" aria-live="polite" aria-busy="true">
      <div className={styles.symbol} aria-hidden="true" style={waitingSymbolStyle}>
        <div className={frameVisibilityClassName(styles.frame, styles["frame-visible"], isRevealed)}>
          <span className={styles["frame-asset"]} role="presentation" aria-hidden="true" />
        </div>
      </div>
      <span className={styles.label}>Loading…</span>
    </div>
  );
}

export default Loader;
