import { useCallback, useEffect, useRef, useState } from "react";

const DEFAULT_INITIAL_VISIBLE_DURATION_MS = 3000;
const DEFAULT_REVEAL_DURATION_MS = 5000;

/**
 * 意图：提供“初始展示一段时间，随后在触发器提示下临时再现”的可见性状态机。
 * 输入：
 *  - initialVisibleDurationMs：首屏展示时长，默认 3000ms。
 *  - revealDurationMs：触发后再次展示的持续时间，默认 5000ms。
 * 输出：
 *  - isVisible：当前是否展示。
 *  - reveal：触发再次展示的回调。
 * 流程：
 *  1) 初始化时调度隐藏计时器；
 *  2) 外部触发 reveal 时复位计时器并延长展示；
 *  3) 卸载时清理计时器，避免内存泄漏。
 * 错误处理：依赖浏览器计时器，如运行环境不支持 window 则提前返回。
 * 复杂度：O(1) 状态存取与计时器操作，时间与空间复杂度均为常数。
 */
function useDockedICPVisibility({
  initialVisibleDurationMs = DEFAULT_INITIAL_VISIBLE_DURATION_MS,
  revealDurationMs = DEFAULT_REVEAL_DURATION_MS,
} = {}) {
  const [isVisible, setIsVisible] = useState(true);
  const hideTimerRef = useRef(null);
  const scheduleHide = useCallback((delayMs) => {
    if (typeof window === "undefined") return;
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    hideTimerRef.current = window.setTimeout(() => {
      setIsVisible(false);
      hideTimerRef.current = null;
    }, delayMs);
  }, []);
  useEffect(() => {
    scheduleHide(initialVisibleDurationMs);
    return () => {
      const current = hideTimerRef.current;
      if (!current) return;
      clearTimeout(current);
      hideTimerRef.current = null;
    };
  }, [initialVisibleDurationMs, scheduleHide]);
  const reveal = useCallback(() => {
    setIsVisible(true);
    scheduleHide(revealDurationMs);
  }, [revealDurationMs, scheduleHide]);
  return { isVisible, reveal };
}

export default useDockedICPVisibility;
