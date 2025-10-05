/**
 * 背景：
 *  - 等待动画的唯一动态效果是素材由灰转黑，需要与序列帧切换解耦，避免 Loader 组件同时维护帧与过渡状态。
 * 目的：
 *  - 提供独立 Hook 负责管理 requestAnimationFrame 生命周期，使 Loader 聚焦于布局与样式。
 * 关键决策与取舍：
 *  - 使用 requestAnimationFrame 而非 setTimeout，确保过渡在浏览器绘制时机触发，避免低端设备抖动。
 * 影响范围：
 *  - 任何使用该 Hook 的组件需在卸载时自动取消帧任务，防止内存泄漏。
 * 演进与TODO：
 *  - TODO：后续可支持自定义缓动或过渡时长，以适配品牌主题切换。
 */
import { useEffect, useRef, useState } from "react";

export default function useFrameReveal(frameToken) {
  const [isRevealed, setIsRevealed] = useState(false);
  const animationFrameRef = useRef(null);

  useEffect(() => {
    setIsRevealed(false);
    animationFrameRef.current = requestAnimationFrame(() => {
      setIsRevealed(true);
    });

    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [frameToken]);

  return isRevealed;
}
