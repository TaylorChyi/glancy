/**
 * 背景：
 *  - ICP 备案信息在底部 docker 内默认常驻，导致交互空间受限且视觉上略显干扰。
 * 目的：
 *  - 抽离“定时隐藏 + 悬停暂显”逻辑，便于在容器组件中复用，并保持展示组件纯粹。
 * 关键决策与取舍：
 *  - 采用 Hook 管理可见性状态而非直接写入组件，利于测试与后续扩展（如引入配置或状态机）。
 *  - 使用单一隐藏计时器统一管理初始与触发后的可视时长，避免多计时器竞态。
 * 影响范围：
 *  - 底部 docker 内 ICP 组件的显隐逻辑；其它直接引用 ICP 的场景不受影响。
 * 演进与TODO：
 *  - 后续可将时长参数通过配置中心或特性开关注入，以支持运营按需调整。
 */
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

  const clearHideTimer = useCallback(() => {
    if (!hideTimerRef.current) {
      return;
    }
    clearTimeout(hideTimerRef.current);
    hideTimerRef.current = null;
  }, []);

  const scheduleHide = useCallback(
    (delayMs) => {
      if (typeof window === "undefined") {
        return;
      }
      clearHideTimer();
      hideTimerRef.current = window.setTimeout(() => {
        setIsVisible(false);
        hideTimerRef.current = null;
      }, delayMs);
    },
    [clearHideTimer],
  );

  useEffect(() => {
    scheduleHide(initialVisibleDurationMs);
    return () => {
      clearHideTimer();
    };
  }, [clearHideTimer, initialVisibleDurationMs, scheduleHide]);

  const reveal = useCallback(() => {
    setIsVisible(true);
    scheduleHide(revealDurationMs);
  }, [revealDurationMs, scheduleHide]);

  return { isVisible, reveal };
}

export default useDockedICPVisibility;
