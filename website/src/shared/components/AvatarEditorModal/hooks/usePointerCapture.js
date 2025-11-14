import { useCallback, useRef } from "react";

const usePointerCapture = ({ containerRef }) => {
  const pointerIdRef = useRef(null);

  const capturePointer = useCallback(
    (pointerId) => {
      if (!containerRef.current) {
        return false;
      }
      containerRef.current.setPointerCapture(pointerId);
      pointerIdRef.current = pointerId;
      return true;
    },
    [containerRef],
  );

  const releasePointer = useCallback(
    (pointerId) => {
      if (pointerIdRef.current !== pointerId) {
        return;
      }
      pointerIdRef.current = null;
      if (containerRef.current) {
        containerRef.current.releasePointerCapture(pointerId);
      }
    },
    [containerRef],
  );

  const resetPointerCapture = useCallback(() => {
    pointerIdRef.current = null;
  }, []);

  return { capturePointer, releasePointer, pointerIdRef, resetPointerCapture };
};

export default usePointerCapture;
