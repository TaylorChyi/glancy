import { useMemo } from "react";
import waitingFrame1 from "@/assets/waiting-frame-1.svg";
import waitingFrame2 from "@/assets/waiting-frame-2.svg";
import waitingFrame3 from "@/assets/waiting-frame-3.svg";
import styles from "./Loader.module.css";
import waitingAnimationStrategy from "./waitingAnimationStrategy.cjs";
import useWaitingFrameCycle from "./useWaitingFrameCycle";

/*
 * 策略模式：
 *  - 背景：等待动画的节奏与素材尺寸会随品牌升级而演变，若继续在组件内直接写死常量，将导致后续变更触碰 JSX 结构。
 *  - 方案：通过独立策略模块集中管理节奏计算，Loader 仅负责渲染逻辑，后续替换策略即可切换动画风格。
 *  - 取舍：策略模块引入一次额外函数调用，但换取单测友好与多动画方案扩展能力。
 */
const WAITING_ANIMATION_STRATEGY = waitingAnimationStrategy;

// 设计说明：统一声明序列帧画布尺寸，确保所有素材在等高策略下共享同一纵横比。
const WAITING_FRAME_DIMENSIONS = WAITING_ANIMATION_STRATEGY.canvas;
const WAITING_FRAME_ASPECT_RATIO = Number(
  (WAITING_FRAME_DIMENSIONS.width / WAITING_FRAME_DIMENSIONS.height).toFixed(6),
);
const WAITING_FRAMES = Object.freeze([
  waitingFrame1,
  waitingFrame2,
  waitingFrame3,
]);
const WAITING_SYMBOL_STYLE_BASE = Object.freeze({
  "--waiting-frame-height": `min(65vh, ${WAITING_FRAME_DIMENSIONS.height}px)`,
  "--waiting-frame-aspect-ratio": WAITING_FRAME_ASPECT_RATIO,
});

function Loader() {
  const { currentFrame, handleCycleComplete, cycleDurationMs } =
    useWaitingFrameCycle(WAITING_FRAMES);
  const waitingSymbolStyle = useMemo(
    () => ({
      ...WAITING_SYMBOL_STYLE_BASE,
      "--waiting-fill-duration": `${cycleDurationMs}ms`,
    }),
    [cycleDurationMs],
  );

  return (
    <div
      className={styles.loader}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div
        className={styles.symbol}
        aria-hidden="true"
        style={waitingSymbolStyle}
      >
        <div className={styles.frame}>
          <img
            className={styles["frame-base"]}
            src={currentFrame}
            alt=""
            loading="lazy"
            decoding="async"
            width={WAITING_FRAME_DIMENSIONS.width}
            height={WAITING_FRAME_DIMENSIONS.height}
          />
          <img
            className={styles["frame-overlay"]}
            src={currentFrame}
            alt=""
            loading="lazy"
            decoding="async"
            width={WAITING_FRAME_DIMENSIONS.width}
            height={WAITING_FRAME_DIMENSIONS.height}
            onAnimationIteration={handleCycleComplete}
          />
        </div>
      </div>
      <span className={styles.label}>Loading…</span>
    </div>
  );
}

export default Loader;
