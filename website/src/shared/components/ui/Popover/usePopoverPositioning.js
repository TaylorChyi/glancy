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

  const resolvePosition = usePopoverPositionUpdater({
    anchorRef,
    contentRef,
    placement,
    fallbackPlacements,
    align,
    offset,
  });

  const applyPosition = useCallback(() => {
    if (!isOpen) return;
    const resolution = resolvePosition();
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
    isOpen,
    resolvePosition,
    setActivePlacement,
    setPosition,
    setVisible,
  ]);

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
