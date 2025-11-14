import { useCallback, useEffect } from "react";

/**
 * Controls a requestAnimationFrame lifecycle for positioning updates.
 */
export function useFrameController({ frameRef, isOpen, applyPosition }) {
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
