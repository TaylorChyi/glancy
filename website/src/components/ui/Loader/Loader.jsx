/**
 * 背景：
 *  - 等待动画素材从三帧轮播收敛为单帧遮罩动画，旧实现通过滤镜闪烁黑底影响质感。
 * 目的：
 *  - 采用分层渲染策略让灰度底图与黑色覆盖独立控制，并借助 Hook 管理帧节奏与透明度往复。
 * 关键决策与取舍：
 *  - 选用策略模式（waitingAnimationStrategy）集中封装节奏与画布尺寸，Loader 仅负责渲染结构；
 *  - 以 useWaitingFrameCycle 提供 shouldSchedule 钩子，确保单帧素材跳过调度避免无意义重置；
 *  - 通过 useFrameReveal 与渐隐动画组合打造往复呼吸效果，保持组件职责纯粹与动画语义分离。
 * 影响范围：
 *  - Loader 组件调用链、等待动画 Hook 与样式模块；外部 API 未变化，仍暴露标准状态语义。
 * 演进与TODO：
 *  - TODO：后续可在覆盖层加速率、节奏策略中引入主题自定义或低性能设备降级逻辑。
 */
import { useMemo } from "react";
import waittingFrame from "@/assets/waitting-frame.svg";
import styles from "./Loader.module.css";
import waitingAnimationStrategy from "./waitingAnimationStrategy.cjs";
import useWaitingFrameCycle from "./useWaitingFrameCycle";
import useFrameReveal from "./useFrameReveal";

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
const WAITING_FRAMES = Object.freeze([waittingFrame]);
// 设计说明：单帧素材默认不触发调度，依赖 Hook 内的 shouldSchedule 控制节奏。
const WAITING_CYCLE_OPTIONS = Object.freeze({
  shouldSchedule: WAITING_FRAMES.length > 1,
});

// 设计取舍：33vh 为视觉规范要求的显示高度，同时保留像素级上限避免 SVG 溢出。
const WAITING_SYMBOL_STYLE_BASE = Object.freeze({
  "--waiting-frame-height": `min(33vh, ${WAITING_FRAME_DIMENSIONS.height}px)`,
  "--waiting-frame-aspect-ratio": WAITING_FRAME_ASPECT_RATIO,
});
const WAITING_FADE_INTERVAL_RATIO = 0.5; // 经验值：淡入淡出各占半个节奏，营造平缓呼吸感。

function computeFadeIntervalMs(cycleDurationMs) {
  const interval = Math.round(cycleDurationMs * WAITING_FADE_INTERVAL_RATIO);
  return interval > 0 ? interval : cycleDurationMs;
}

function composeOverlayClassName(isRevealed) {
  const baseClassName = styles["frame-overlay"];
  if (!isRevealed) {
    return baseClassName;
  }
  return `${baseClassName} ${styles["frame-overlay-visible"]}`;
}

function Loader() {
  const { currentFrame, cycleDurationMs } = useWaitingFrameCycle(
    WAITING_FRAMES,
    WAITING_CYCLE_OPTIONS,
  );
  const fadeIntervalMs = computeFadeIntervalMs(cycleDurationMs);
  const isRevealed = useFrameReveal(currentFrame, {
    intervalMs: fadeIntervalMs,
  });

  const waitingSymbolStyle = useMemo(() => {
    return {
      ...WAITING_SYMBOL_STYLE_BASE,
      "--waiting-fade-duration": `${fadeIntervalMs}ms`,
    };
  }, [fadeIntervalMs]);

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
          {/*
           * 分层策略说明：
           *  - 背景：淡入淡出需在灰底与黑色覆盖之间往复切换透明度，以呼应品牌“呼吸感”演绎。
           *  - 方案：保留双图层结构，底层应用灰阶滤镜，覆盖层通过透明度变换展现节奏，避免引入额外 DOM。
           *  - 取舍：沿用双 <img> 成本极低，却可复用缓存并保持主题扩展弹性。
           */}
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
            className={composeOverlayClassName(isRevealed)}
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
