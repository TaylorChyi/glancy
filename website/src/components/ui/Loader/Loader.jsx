import waitingFrame1 from "@/assets/waiting-frame-1.svg";
import waitingFrame2 from "@/assets/waiting-frame-2.svg";
import waitingFrame3 from "@/assets/waiting-frame-3.svg";
import styles from "./Loader.module.css";
import waitingAnimationStrategy from "./waitingAnimationStrategy.cjs";

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
const WAITING_FRAMES = [waitingFrame1, waitingFrame2, waitingFrame3];
const WAITING_TIMELINE = WAITING_ANIMATION_STRATEGY.buildTimeline(
  WAITING_FRAMES.length,
);

// 语义化映射：统一导出 CSS 自定义属性，避免在 JSX 中散落常量格式化逻辑。
// 节奏同步：高度与节奏变量同时暴露给样式层，以保证 1.5 秒轮换时三帧素材保持绝对等高与柔和渐变。
const WAITING_SYMBOL_STYLE = Object.freeze({
  "--waiting-frame-count": WAITING_TIMELINE.frameCount,
  "--waiting-frame-interval": WAITING_TIMELINE.interval,
  "--waiting-animation-duration": WAITING_TIMELINE.duration,
  "--waiting-frame-height": `min(65vh, ${WAITING_FRAME_DIMENSIONS.height}px)`,
  "--waiting-frame-aspect-ratio": WAITING_FRAME_ASPECT_RATIO,
});

function Loader() {
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
        style={WAITING_SYMBOL_STYLE}
      >
        {WAITING_FRAMES.map((frameSrc, index) => (
          <img
            key={frameSrc}
            className={styles.frame}
            src={frameSrc}
            alt=""
            loading="lazy"
            decoding="async"
            width={WAITING_FRAME_DIMENSIONS.width}
            height={WAITING_FRAME_DIMENSIONS.height}
            style={{
              "--waiting-frame-delay": WAITING_TIMELINE.delays[index],
            }}
          />
        ))}
      </div>
      <span className={styles.label}>Loading…</span>
    </div>
  );
}

export default Loader;
