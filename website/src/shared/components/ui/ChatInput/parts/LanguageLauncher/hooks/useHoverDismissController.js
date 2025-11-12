import { useCallback, useEffect, useRef } from "react";
import { HOVER_DISMISS_DELAY } from "../constants.js";

export function useHoverDismissController(onClose) {
  const timerRef = useRef(null);

  const cancel = useCallback(() => {
    if (timerRef.current !== null && typeof window !== "undefined") {
      window.clearTimeout(timerRef.current);
    }
    timerRef.current = null;
  }, []);

  const schedule = useCallback(() => {
    cancel();
    if (typeof window === "undefined") {
      onClose();
      return;
    }
    timerRef.current = window.setTimeout(() => {
      timerRef.current = null;
      onClose();
    }, HOVER_DISMISS_DELAY);
  }, [cancel, onClose]);

  useEffect(() => cancel, [cancel]);

  return { enter: cancel, leave: schedule, cancel };
}
