import { useCallback } from "react";
import { computePopoverPosition, getViewportMetrics } from "./placementEngine";

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
