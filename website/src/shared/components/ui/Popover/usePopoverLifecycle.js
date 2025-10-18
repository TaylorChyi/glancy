/**
 * 背景：
 *  - Popover 的生命周期副作用（布局调度、全局事件、状态复位）分散在组件中，难以复用。
 * 目的：
 *  - 提供聚合的生命周期 Hook，简化主 Hook 实现并控制文件体量。
 * 关键决策与取舍：
 *  - 将布局相关副作用封装为 usePositioningCycle；
 *  - 将关闭与事件监听封装为 useGlobalDismissHandlers；
 *  - 将可见性复位封装为 usePlacementReset。
 * 影响范围：
 *  - usePopoverPositioning 复用这些 Hook，调用方无需关注内部细节。
 * 演进与TODO：
 *  - 可按需扩展更多事件（例如 focus trap）并在此模块统一管理。
 */
import { useEffect, useLayoutEffect } from "react";

const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

export function usePositioningCycle({ isOpen, scheduleUpdate, clearFrame }) {
  useIsomorphicLayoutEffect(() => {
    if (!isOpen) return undefined;
    scheduleUpdate();
    return () => {
      clearFrame();
    };
  }, [clearFrame, isOpen, scheduleUpdate]);
}

export function useGlobalDismissHandlers({
  isOpen,
  anchorRef,
  contentRef,
  onClose,
  scheduleUpdate,
  setVisible,
}) {
  useEffect(() => {
    if (!isOpen) return undefined;

    setVisible(false);

    const handleResize = () => {
      scheduleUpdate();
    };

    const handleScroll = () => {
      scheduleUpdate();
    };

    const handlePointerDown = (event) => {
      const anchorEl = anchorRef?.current;
      const popoverEl = contentRef.current;
      if (popoverEl?.contains(event.target)) return;
      if (anchorEl?.contains(event.target)) return;
      onClose?.();
    };

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        onClose?.();
      }
    };

    const anchorEl = anchorRef?.current;
    const popoverEl = contentRef.current;
    const resizeObserver =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(() => scheduleUpdate())
        : null;

    window.addEventListener("resize", handleResize);
    window.addEventListener("scroll", handleScroll, true);
    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    if (resizeObserver) {
      if (anchorEl) resizeObserver.observe(anchorEl);
      if (popoverEl) resizeObserver.observe(popoverEl);
    }

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("scroll", handleScroll, true);
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
      resizeObserver?.disconnect();
    };
  }, [anchorRef, contentRef, isOpen, onClose, scheduleUpdate, setVisible]);
}

export function usePlacementReset({
  isOpen,
  placement,
  setVisible,
  setActivePlacement,
}) {
  useEffect(() => {
    if (!isOpen) {
      setVisible(false);
      setActivePlacement(placement);
    }
  }, [isOpen, placement, setActivePlacement, setVisible]);
}
