/**
 * 背景：
 *  - Popover 组件过于庞大，定位副作用与渲染逻辑混杂，导致 lint 无法通过。
 * 目的：
 *  - 抽离定位与生命周期管理逻辑为独立 Hook，保持组件聚焦展示职责。
 * 关键决策与取舍：
 *  - 使用组合式 Hook 拆分职责，便于复用与单测；
 *  - 在 Hook 内处理 SSR 兼容，防止调用方重复判断环境。
 * 影响范围：
 *  - Popover 组件依赖该 Hook 输出定位状态。
 * 演进与TODO：
 *  - 后续可继续拆分事件监听逻辑以支持更多触发器场景。
 */
import { useCallback, useEffect } from "react";
import {
  useGlobalDismissHandlers,
  usePlacementReset,
  usePositioningCycle,
} from "./usePopoverLifecycle";
import { usePopoverCoreState } from "./usePopoverState";
import { usePopoverPositionUpdater } from "./usePopoverPositionUpdater";

/**
 * 意图：集中管理 requestAnimationFrame 生命周期，避免多处重复控制。
 * 输入：frameRef、开关状态与位置更新函数。
 * 输出：包含 clearFrame 与 scheduleUpdate 的接口。
 */
function useFrameController({ frameRef, isOpen, applyPosition }) {
  const clearFrame = useCallback(() => {
    if (frameRef.current) {
      cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }
  }, [frameRef]);

  const scheduleUpdate = useCallback(() => {
    if (!isOpen || typeof window === "undefined") return;
    clearFrame();
    frameRef.current = requestAnimationFrame(() => {
      frameRef.current = null;
      applyPosition();
    });
  }, [applyPosition, clearFrame, frameRef, isOpen]);

  useEffect(() => () => clearFrame(), [clearFrame]);

  return { clearFrame, scheduleUpdate };
}

export default function usePopoverPositioning({
  anchorRef,
  isOpen,
  placement,
  fallbackPlacements,
  align,
  offset,
  onClose,
}) {
  const {
    contentRef,
    frameRef,
    position,
    setPosition,
    visible,
    setVisible,
    activePlacement,
    setActivePlacement,
    setContentNode,
  } = usePopoverCoreState(placement);

  const applyPosition = usePopoverPositionUpdater({
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
  });

  const { clearFrame, scheduleUpdate } = useFrameController({
    frameRef,
    isOpen,
    applyPosition,
  });

  usePositioningCycle({ isOpen, scheduleUpdate, clearFrame });
  useGlobalDismissHandlers({
    isOpen,
    anchorRef,
    contentRef,
    onClose,
    scheduleUpdate,
    setVisible,
  });

  usePlacementReset({
    isOpen,
    placement,
    setVisible,
    setActivePlacement,
  });

  return {
    setContentNode,
    position,
    visible,
    activePlacement,
  };
}
