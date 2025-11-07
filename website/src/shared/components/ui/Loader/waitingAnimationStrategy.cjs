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
  const delays = Array.from({ length: frameCount }, (_, index) =>
    computeDelay(index),
  );
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
