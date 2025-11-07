import { useCallback, useRef } from "react";

const INITIAL_POINT = { x: 0, y: 0 };

const usePointerDrag = ({ containerRef, onOffsetChange }) => {
  const pointerIdRef = useRef(null);
  const lastPointRef = useRef(INITIAL_POINT);

  const resetPointerTracking = useCallback(() => {
    pointerIdRef.current = null;
    lastPointRef.current = INITIAL_POINT;
  }, []);

  const handlePointerDown = useCallback(
    (event) => {
      if (!containerRef.current) return;
      event.preventDefault();
      containerRef.current.setPointerCapture(event.pointerId);
      pointerIdRef.current = event.pointerId;
      lastPointRef.current = { x: event.clientX, y: event.clientY };
    },
    [containerRef],
  );

  const handlePointerMove = useCallback(
    (event) => {
      if (pointerIdRef.current !== event.pointerId) return;
      const deltaX = event.clientX - lastPointRef.current.x;
      const deltaY = event.clientY - lastPointRef.current.y;
      if (deltaX === 0 && deltaY === 0) return;
      lastPointRef.current = { x: event.clientX, y: event.clientY };
      onOffsetChange(deltaX, deltaY);
    },
    [onOffsetChange],
  );

  const handlePointerUp = useCallback(
    (event) => {
      if (pointerIdRef.current !== event.pointerId) return;
      pointerIdRef.current = null;
      if (containerRef.current) {
        containerRef.current.releasePointerCapture(event.pointerId);
      }
    },
    [containerRef],
  );

  return {
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    resetPointerTracking,
  };
};

export default usePointerDrag;
