/**
 * 背景：
 *  - 等待动画存在多套素材与节奏，历史实现将帧间隔写死在组件内，难以切换。
 * 目的：
 *  - 以策略模式封装动画时间线，集中管理节奏、尺寸与延迟逻辑。
 * 关键决策与取舍：
 *  - 选择 CommonJS 导出，便于在 Jest 环境下直接复用并编写单测。
 *  - 暂不引入第三方动画库，保持零依赖与易于调试。
 * 影响范围：
 *  - Loader 组件与测试共享该策略对象，减少重复配置。
 * 演进与TODO：
 *  - TODO：支持根据主题动态切换不同节奏策略或在夜间模式中缩短节奏。
 */
// 设计约束：根据品牌节奏需求，将单帧展示时长固定为 1.5 秒，便于与呼吸动画同步。
const FRAME_INTERVAL_MS = 1500;

const CANVAS_DIMENSIONS = Object.freeze({
  width: 682,
  height: 454,
});

function assertFrameIndex(frameIndex) {
  if (!Number.isInteger(frameIndex) || frameIndex < 0) {
    throw new TypeError("frameIndex 必须是非负整数");
  }
}

function assertFrameCount(frameCount) {
  if (!Number.isInteger(frameCount) || frameCount <= 0) {
    throw new TypeError("frameCount 必须是正整数");
  }
}

function formatMilliseconds(value) {
  return `${value}ms`;
}

function computeDelay(frameIndex) {
  assertFrameIndex(frameIndex);
  if (frameIndex === 0) {
    return "0ms";
  }
  const offset = frameIndex * FRAME_INTERVAL_MS * -1;
  return formatMilliseconds(offset);
}

function computeDuration(frameCount) {
  assertFrameCount(frameCount);
  return formatMilliseconds(frameCount * FRAME_INTERVAL_MS);
}

function buildTimeline(frameCount) {
  const duration = computeDuration(frameCount);
  const delays = Array.from({ length: frameCount }, (_, index) => computeDelay(index));
  return {
    frameCount,
    interval: formatMilliseconds(FRAME_INTERVAL_MS),
    duration,
    delays,
  };
}

const WAITING_ANIMATION_STRATEGY = Object.freeze({
  frameIntervalMs: FRAME_INTERVAL_MS,
  canvas: CANVAS_DIMENSIONS,
  delayFor: computeDelay,
  durationFor: computeDuration,
  buildTimeline,
});

module.exports = WAITING_ANIMATION_STRATEGY;
