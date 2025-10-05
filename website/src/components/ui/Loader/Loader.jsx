import { useMemo } from "react";
import styles from "./Loader.module.css";
import waitingAnimationStrategy from "./waitingAnimationStrategy.cjs";
import useWaitingFrameCycle from "./useWaitingFrameCycle";
import useFrameReveal from "./useFrameReveal";
import WAITING_FRAMES from "./waitingFrameAssets";

/*
 * 策略模式：
 *  - 背景：等待动画节奏与素材会随品牌升级调整；若在组件中硬编码展示逻辑，将在每次换素材时触碰 JSX 结构。
 *  - 方案：保留独立策略模块负责画布尺寸与节奏，Loader 聚焦呈现并复用 Hook 提供的帧调度；当节奏变动时仅需替换策略。
 *  - 取舍：策略模块带来一次额外的函数调用，但换取了更高的可测性与扩展性，符合“童子军军规”。
 */
const WAITING_ANIMATION_STRATEGY = waitingAnimationStrategy;

// 设计说明：统一声明序列帧画布尺寸，确保所有素材在等高策略下共享同一纵横比。
const WAITING_FRAME_DIMENSIONS = WAITING_ANIMATION_STRATEGY.canvas;
const WAITING_FRAME_ASPECT_RATIO = Number(
  (WAITING_FRAME_DIMENSIONS.width / WAITING_FRAME_DIMENSIONS.height).toFixed(6),
);
// 设计取舍：33vh 为视觉规范要求的显示高度，同时保留像素级上限避免 SVG 溢出。
const WAITING_SYMBOL_STYLE_BASE = Object.freeze({
  "--waiting-frame-height": `min(33vh, ${WAITING_FRAME_DIMENSIONS.height}px)`,
  "--waiting-frame-aspect-ratio": WAITING_FRAME_ASPECT_RATIO,
});
const WAITING_REVEAL_DURATION_RATIO = 0.65; // 经验值：色彩过渡占节奏 65%，避免突兀闪烁。

function composeFrameClassName(isRevealed) {
  const baseClassName = styles["frame-image"];
  if (!isRevealed) {
    return baseClassName;
  }
  return `${baseClassName} ${styles["frame-image-revealed"]}`;
}

function Loader() {
  const { currentFrame, cycleDurationMs } =
    useWaitingFrameCycle(WAITING_FRAMES);
  const isRevealed = useFrameReveal(currentFrame);

  const waitingSymbolStyle = useMemo(() => {
    const revealDuration = Math.round(
      cycleDurationMs * WAITING_REVEAL_DURATION_RATIO,
    );
    return {
      ...WAITING_SYMBOL_STYLE_BASE,
      "--waiting-reveal-duration": `${revealDuration}ms`,
    };
  }, [cycleDurationMs]);

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
            className={composeFrameClassName(isRevealed)}
            src={currentFrame}
            alt=""
            loading="lazy"
            decoding="async"
            width={WAITING_FRAME_DIMENSIONS.width}
            height={WAITING_FRAME_DIMENSIONS.height}
          />
        </div>
      </div>
      <span className={styles.label}>Loading…</span>
    </div>
  );
}

export default Loader;
