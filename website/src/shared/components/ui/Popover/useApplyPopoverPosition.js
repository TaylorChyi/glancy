import { useCallback } from "react";

/**
 * Provides a memoized callback that applies resolved popover position data.
 */
export function useApplyPopoverPosition({
  isOpen,
  resolvePosition,
  setPosition,
  setActivePlacement,
  setVisible,
}) {
  return useCallback(() => {
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
}
