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
