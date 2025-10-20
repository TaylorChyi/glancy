/**
 * 背景：
 *  - 等待动画素材从三帧轮播收敛为单帧遮罩动画，旧实现通过滤镜闪烁黑底影响质感。
 *  - 2025-03：设计强调“中心显现、向外扩展，再向内收束”的等待节奏，需在保持架构解耦的前提下调整渲染结构。
 * 目的：
 *  - 采用策略模式与 Hook 管理节奏，同时通过透明度往复实现整幅素材渐隐渐显。
 * 关键决策与取舍：
 *  - 选用策略模式（waitingAnimationStrategy）集中封装节奏与画布尺寸，Loader 仅负责渲染结构；
 *  - 以 useWaitingFrameCycle 提供 shouldSchedule 钩子，确保单帧素材跳过调度避免无意义重置；
 *  - 通过 useFrameReveal 与方向性渐隐动画组合打造往复呼吸效果，保持组件职责纯粹与动画语义分离。
 *  - 引入 mask + currentColor 映射，确保等待素材随主题前景色自适应。
 * 影响范围：
 *  - Loader 组件调用链、等待动画 Hook 与样式模块；外部 API 未变化，仍暴露标准状态语义。
 * 演进与TODO：
 *  - TODO：引入主题化节奏或低性能设备降级策略，必要时为渐隐渐显增加特性开关。
 */
import { useMemo } from "react";
import waittingFrame from "@assets/interface/controls/waitting-frame.svg";
import styles from "./Loader.module.css";
import waitingAnimationStrategy from "./waitingAnimationStrategy.cjs";
import useWaitingFrameCycle from "./useWaitingFrameCycle";
import useFrameReveal from "./useFrameReveal";
import frameVisibilityClassName from "./frameVisibilityClassName";
import { deriveRevealTiming } from "./waitingRevealStrategy";
import { buildWaitingSymbolStyle } from "./waitingSymbolStyle";

/*
 * 策略模式：
 *  - 背景：等待动画节奏与素材会随品牌升级调整；若在组件中硬编码展示逻辑，将在每次换素材时触碰 JSX 结构。
 *  - 方案：保留独立策略模块负责画布尺寸与节奏，Loader 聚焦呈现并复用 Hook 提供的帧调度；当节奏变动时仅需替换策略。
 *  - 取舍：策略模块带来一次额外的函数调用，但换取了更高的可测性与扩展性，符合“童子军军规”。
 */
const WAITING_ANIMATION_STRATEGY = waitingAnimationStrategy;

const WAITING_FRAME_DIMENSIONS = WAITING_ANIMATION_STRATEGY.canvas;
const WAITING_FRAMES = Object.freeze([waittingFrame]);
// 设计说明：单帧素材默认不触发调度，依赖 Hook 内的 shouldSchedule 控制节奏。
const WAITING_CYCLE_OPTIONS = Object.freeze({
  shouldSchedule: WAITING_FRAMES.length > 1,
});
const WAITING_FRAME_IMAGE_VALUE = `url("${waittingFrame}")`;

function Loader() {
  const { currentFrame, cycleDurationMs } = useWaitingFrameCycle(
    WAITING_FRAMES,
    WAITING_CYCLE_OPTIONS,
  );
  const { intervalMs: fadeIntervalMs, durationMs: fadeDurationMs } =
    deriveRevealTiming(cycleDurationMs);
  const isRevealed = useFrameReveal(currentFrame, {
    intervalMs: fadeIntervalMs,
  });

  const waitingSymbolStyle = useMemo(() => {
    return buildWaitingSymbolStyle(
      WAITING_FRAME_DIMENSIONS,
      fadeDurationMs,
      WAITING_FRAME_IMAGE_VALUE,
    );
  }, [fadeDurationMs]);

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
        <div
          className={frameVisibilityClassName(
            styles.frame,
            styles["frame-visible"],
            isRevealed,
          )}
        >
          {/*
           * 视觉策略：
           *  - 背景：品牌将等待动画升级为“中部启动、向两侧延展，再向中心收束”的节奏；
           *  - 方案：改用 SVG 轮廓作为 mask，让背景色（currentColor）透出并配合 clip-path 提供方向性渐隐渐显；
           *  - 取舍：mask 方案保留单帧素材复用能力，同时避免 dangerouslySetInnerHTML 带来的安全审查负担。
           */}
          <span
            className={styles["frame-asset"]}
            role="presentation"
            aria-hidden="true"
          />
        </div>
      </div>
      <span className={styles.label}>Loading…</span>
    </div>
  );
}

export default Loader;
