/**
 * 背景：
 *  - 定位计算既依赖 DOM，又需要更新 React 状态，若散落在主 Hook 容易重复。
 * 目的：
 *  - 提供独立的定位更新 Hook，将几何计算与状态写入解耦。
 * 关键决策与取舍：
 *  - 引入内部的 resolveNextPosition 统一 DOM 读取逻辑；
 *  - 保持纯函数输出，便于单测覆盖与未来扩展。
 * 影响范围：
 *  - usePopoverPositioning 使用该 Hook 触发定位刷新。
 * 演进与TODO：
 *  - 可在此扩展碰撞检测或尺寸缓存以优化性能。
 */
import { useCallback } from "react";
import {
  computePopoverPosition,
  getViewportMetrics,
} from "./placementEngine";

function resolveNextPosition({
  anchorRef,
  contentRef,
  placement,
  fallbackPlacements,
  align,
  offset,
}) {
  const anchorEl = anchorRef?.current;
  const popoverEl = contentRef.current;
  if (!anchorEl || !popoverEl) return null;

  const anchorRect = anchorEl.getBoundingClientRect();
  const popRect = popoverEl.getBoundingClientRect();
  const viewport = getViewportMetrics();

  return computePopoverPosition({
    anchorRect,
    popRect,
    placement,
    fallbackPlacements,
    align,
    offset,
    viewport,
  });
}

export function usePopoverPositionUpdater({
  anchorRef,
  contentRef,
  placement,
  fallbackPlacements,
  align,
  offset,
  isOpen,
  setPosition,
  setActivePlacement,
  setVisible,
}) {
  return useCallback(() => {
    if (!isOpen || typeof window === "undefined") return;

    const resolution = resolveNextPosition({
      anchorRef,
      contentRef,
      placement,
      fallbackPlacements,
      align,
      offset,
    });
    if (!resolution) return;

    setPosition((prev) => {
      if (
        prev.top === resolution.position.top &&
        prev.left === resolution.position.left
      ) {
        return prev;
      }
      return resolution.position;
    });
    setActivePlacement(resolution.placement);
    setVisible(true);
  }, [
    align,
    anchorRef,
    contentRef,
    fallbackPlacements,
    isOpen,
    offset,
    placement,
    setActivePlacement,
    setPosition,
    setVisible,
  ]);
}
