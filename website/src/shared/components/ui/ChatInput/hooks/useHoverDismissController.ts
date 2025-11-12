import { useCallback, useEffect, useRef } from "react";

import { HOVER_DISMISS_DELAY } from "../constants";

export interface HoverDismissController {
  enter: () => void;
  leave: () => void;
  cancel: () => void;
}

export default function useHoverDismissController(
  onClose: () => void,
): HoverDismissController {
  const timerRef = useRef<number | null>(null);

  const cancel = useCallback(() => {
    if (timerRef.current !== null && typeof window !== "undefined") {
      window.clearTimeout(timerRef.current);
    }
    timerRef.current = null;
  }, []);

  const leave = useCallback(() => {
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

  return { enter: cancel, leave, cancel };
}
