/**
 * 背景：
 *  - 等待动画视觉升级为“持续呼吸”的淡入淡出节奏，需在不改动 Loader 结构的前提下引入往复状态管理。
 * 目的：
 *  - 通过 Hook 统一调度 requestAnimationFrame 与 setInterval，既保证首帧在浏览器绘制后出现，也能按节奏往复切换可见态。
 * 关键决策与取舍：
 *  - requestAnimationFrame 负责首帧显现，避免首屏闪烁；setInterval 驱动后续的呼吸节奏，较 setTimeout 更易清理与推理。
 * 影响范围：
 *  - Loader 组件继续以布尔值描述覆盖层是否可见；其他调用方亦可依赖相同语义接入淡入淡出动画。
 * 演进与TODO：
 *  - TODO：增加基于 `prefers-reduced-motion` 的降级策略，必要时改用常量可见态避免眩晕。
 */
import { useEffect, useRef, useState } from "react";

function scheduleInitialReveal(callback) {
  if (typeof requestAnimationFrame === "function") {
    return requestAnimationFrame(callback);
  }
  return setTimeout(callback, 0);
}

function cancelInitialReveal(handle) {
  if (typeof cancelAnimationFrame === "function") {
    cancelAnimationFrame(handle);
    return;
  }
  clearTimeout(handle);
}

function isPositiveDuration(value) {
  return Number.isFinite(value) && value > 0;
}

function scheduleOscillation(callback, intervalMs) {
  if (typeof globalThis.setInterval !== "function") {
    return null;
  }
  return globalThis.setInterval(callback, intervalMs);
}

function cancelOscillation(handle) {
  if (handle === null) {
    return;
  }
  if (typeof globalThis.clearInterval === "function") {
    globalThis.clearInterval(handle);
  }
}

export default function useFrameReveal(frameToken, options = {}) {
  const { intervalMs } = options;
  const [isRevealed, setIsRevealed] = useState(false);
  const animationFrameRef = useRef(null);
  const intervalRef = useRef(null);

  useEffect(() => {
    setIsRevealed(false);
    animationFrameRef.current = scheduleInitialReveal(() => {
      setIsRevealed(true);
    });

    return () => {
      if (animationFrameRef.current !== null) {
        cancelInitialReveal(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [frameToken]);

  useEffect(() => {
    if (!isPositiveDuration(intervalMs)) {
      return undefined;
    }

    intervalRef.current = scheduleOscillation(() => {
      setIsRevealed((previous) => !previous);
    }, intervalMs);

    return () => {
      cancelOscillation(intervalRef.current);
      intervalRef.current = null;
    };
  }, [frameToken, intervalMs]);

  return isRevealed;
}
