import { useCallback } from "react";
import { computePopoverPosition } from "./placementEngine";

const INFINITE_VIEWPORT = {
  width: Number.POSITIVE_INFINITY,
  height: Number.POSITIVE_INFINITY,
};

const getViewportMetrics = (
  targetWindow = typeof window === "undefined" ? undefined : window,
) => {
  if (!targetWindow) {
    return INFINITE_VIEWPORT;
  }
  return {
    width: targetWindow.innerWidth,
    height: targetWindow.innerHeight,
  };
};

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
}) {
  return useCallback(() => {
    return resolveNextPosition({
      anchorRef,
      contentRef,
      placement,
      fallbackPlacements,
      align,
      offset,
    });
  }, [align, anchorRef, contentRef, fallbackPlacements, offset, placement]);
}
