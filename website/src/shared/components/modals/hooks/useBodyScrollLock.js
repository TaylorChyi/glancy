import { useEffect } from "react";
import { ensureModalRoot, lockBodyScroll, unlockBodyScroll } from "../modalRoot";

export const useBodyScrollLock = () => {
  useEffect(() => {
    const root = ensureModalRoot();
    if (!root) return undefined;
    lockBodyScroll();
    return () => {
      unlockBodyScroll();
    };
  }, []);
};
