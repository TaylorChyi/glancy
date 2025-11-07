import { useEffect, useRef, useState } from "react";

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

function getReducedMotionMediaQueryList() {
  if (typeof globalThis.matchMedia !== "function") {
    return null;
  }
  try {
    return globalThis.matchMedia(REDUCED_MOTION_QUERY);
  } catch {
    return null;
  }
}

function readReducedMotionPreference(mediaQueryList) {
  if (!mediaQueryList) {
    return false;
  }
  return Boolean(mediaQueryList.matches);
}

function subscribeReducedMotionChange(mediaQueryList, callback) {
  if (!mediaQueryList) {
    return () => {};
  }
  if (typeof mediaQueryList.addEventListener === "function") {
    mediaQueryList.addEventListener("change", callback);
    return () => mediaQueryList.removeEventListener("change", callback);
  }
  if (typeof mediaQueryList.addListener === "function") {
    mediaQueryList.addListener(callback);
    return () => mediaQueryList.removeListener(callback);
  }
  return () => {};
}

/**
 * 意图：监听用户的动效偏好，动态返回是否需要降级动画。
 * 输入：无（内部读取 `prefers-reduced-motion` 媒体查询）。
 * 输出：布尔值，指示是否应降级为静态呈现。
 * 流程：
 *  1) 读取媒体查询的初始匹配值；
 *  2) 订阅 change 事件，在用户修改系统偏好时实时更新；
 * 错误处理：媒体查询不可用时默认返回 false，保持兼容。
 * 复杂度：O(1)。
 */
function usePrefersReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(() =>
    readReducedMotionPreference(getReducedMotionMediaQueryList()),
  );

  useEffect(() => {
    const mediaQueryList = getReducedMotionMediaQueryList();
    const unsubscribe = subscribeReducedMotionChange(
      mediaQueryList,
      (event) => {
        setPrefersReducedMotion(Boolean(event?.matches));
      },
    );
    return () => {
      unsubscribe();
    };
  }, []);

  return prefersReducedMotion;
}

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

const STATIC_REVEAL_STRATEGY = {
  /**
   * 意图：当用户偏好减少动效时保持帧常显，避免触发眩晕。
   * 输入：setIsRevealed —— 状态更新函数。
   * 输出：返回空的清理函数以符合策略接口。
   * 流程：直接将帧设置为可见，不调度任何振荡任务。
   * 错误处理：无副作用。
   * 复杂度：O(1)。
   */
  apply({ setIsRevealed }) {
    setIsRevealed(true);
    return () => {};
  },
};

const OSCILLATING_REVEAL_STRATEGY = {
  /**
   * 意图：按照既定间隔在可见/不可见之间往复切换。
   * 输入：intervalMs、intervalRef、setIsRevealed。
   * 输出：返回清理函数以终止计时器。
   * 流程：使用 setInterval 周期性翻转布尔值。
   * 错误处理：若运行环境缺失 setInterval，返回的清理函数将成为空操作。
   * 复杂度：O(1)。
   */
  apply({ intervalMs, intervalRef, setIsRevealed }) {
    intervalRef.current = scheduleOscillation(() => {
      setIsRevealed((previous) => !previous);
    }, intervalMs);
    return () => {
      cancelOscillation(intervalRef.current);
      intervalRef.current = null;
    };
  },
};

export default function useFrameReveal(frameToken, options = {}) {
  const { intervalMs } = options;
  const [isRevealed, setIsRevealed] = useState(false);
  const animationFrameRef = useRef(null);
  const intervalRef = useRef(null);
  const prefersReducedMotion = usePrefersReducedMotion();

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
    if (intervalRef.current !== null) {
      cancelOscillation(intervalRef.current);
      intervalRef.current = null;
    }

    if (!isPositiveDuration(intervalMs)) {
      return undefined;
    }

    const strategy = prefersReducedMotion
      ? STATIC_REVEAL_STRATEGY
      : OSCILLATING_REVEAL_STRATEGY;

    const cleanup = strategy.apply({
      intervalMs,
      intervalRef,
      setIsRevealed,
    });

    return () => {
      if (typeof cleanup === "function") {
        cleanup();
      } else if (intervalRef.current !== null) {
        cancelOscillation(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [frameToken, intervalMs, prefersReducedMotion]);

  return isRevealed;
}
