import { useMemo } from "react";

function useViewportInteractions(pointerHandlers, label) {
  const { onPointerDown, onPointerMove, onPointerUp } = pointerHandlers;

  return useMemo(
    () => ({
      onPointerDown,
      onPointerMove,
      onPointerUp,
      onPointerCancel: onPointerUp,
      onPointerLeave: onPointerUp,
      role: "presentation",
      "aria-label": label,
    }),
    [label, onPointerDown, onPointerMove, onPointerUp],
  );
}

export default useViewportInteractions;
