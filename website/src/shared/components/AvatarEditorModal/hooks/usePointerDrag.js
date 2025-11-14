import { useCallback, useRef } from "react";
import usePointerCapture from "./usePointerCapture.js";

const INITIAL_POINT = { x: 0, y: 0 };

const usePointerPositionTracker = () => {
  const lastPointRef = useRef(INITIAL_POINT);

  const setLastPoint = useCallback((point) => {
    lastPointRef.current = point;
  }, []);

  const resetLastPoint = useCallback(() => {
    lastPointRef.current = INITIAL_POINT;
  }, []);

  return { lastPointRef, setLastPoint, resetLastPoint };
};

const useResetPointerTracking = ({
  resetPointerCapture,
  resetLastPoint,
}) =>
  useCallback(() => {
    resetPointerCapture();
    resetLastPoint();
  }, [resetLastPoint, resetPointerCapture]);

const usePointerDownHandler = ({ capturePointer, setLastPoint }) =>
  useCallback(
    (event) => {
      event.preventDefault();
      if (!capturePointer(event.pointerId)) {
        return;
      }
      setLastPoint({ x: event.clientX, y: event.clientY });
    },
    [capturePointer, setLastPoint],
  );

const usePointerMoveHandler = ({
  pointerIdRef,
  lastPointRef,
  setLastPoint,
  onOffsetChange,
}) =>
  useCallback(
    (event) => {
      if (pointerIdRef.current !== event.pointerId) {
        return;
      }
      const deltaX = event.clientX - lastPointRef.current.x;
      const deltaY = event.clientY - lastPointRef.current.y;
      if (deltaX === 0 && deltaY === 0) {
        return;
      }
      setLastPoint({ x: event.clientX, y: event.clientY });
      onOffsetChange(deltaX, deltaY);
    },
    [lastPointRef, onOffsetChange, pointerIdRef, setLastPoint],
  );

const usePointerUpHandler = ({
  pointerIdRef,
  releasePointer,
  resetLastPoint,
}) =>
  useCallback(
    (event) => {
      if (pointerIdRef.current !== event.pointerId) {
        return;
      }
      releasePointer(event.pointerId);
      resetLastPoint();
    },
    [pointerIdRef, releasePointer, resetLastPoint],
  );

const usePointerDrag = ({ containerRef, onOffsetChange }) => {
  const captureState = usePointerCapture({ containerRef });
  const pointerPositions = usePointerPositionTracker();

  return {
    handlePointerDown: usePointerDownHandler({
      capturePointer: captureState.capturePointer,
      setLastPoint: pointerPositions.setLastPoint,
    }),
    handlePointerMove: usePointerMoveHandler({
      pointerIdRef: captureState.pointerIdRef,
      lastPointRef: pointerPositions.lastPointRef,
      setLastPoint: pointerPositions.setLastPoint,
      onOffsetChange,
    }),
    handlePointerUp: usePointerUpHandler({
      pointerIdRef: captureState.pointerIdRef,
      releasePointer: captureState.releasePointer,
      resetLastPoint: pointerPositions.resetLastPoint,
    }),
    resetPointerTracking: useResetPointerTracking({
      resetPointerCapture: captureState.resetPointerCapture,
      resetLastPoint: pointerPositions.resetLastPoint,
    }),
  };
};

export default usePointerDrag;
