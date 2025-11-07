import { useEffect } from "react";
import usePointerDrag from "./usePointerDrag.js";

const usePointerControls = ({ open, source, containerRef, onOffsetChange }) => {
  const {
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    resetPointerTracking,
  } = usePointerDrag({ containerRef, onOffsetChange });

  useEffect(() => {
    resetPointerTracking();
  }, [open, source, resetPointerTracking]);

  return {
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    resetPointerTracking,
  };
};

export default usePointerControls;
