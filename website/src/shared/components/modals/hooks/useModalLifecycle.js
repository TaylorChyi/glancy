import { useRef } from "react";
import { useEscapeKey } from "@shared/hooks";
import { ensureModalRoot } from "../modalRoot";
import { useBodyScrollLock } from "./useBodyScrollLock";
import { useModalFocusTrap } from "./useModalFocusTrap";

export const useModalLifecycle = (onClose) => {
  useEscapeKey(onClose);
  const contentRef = useRef(null);
  useBodyScrollLock();
  useModalFocusTrap(contentRef);
  if (typeof document === "undefined") {
    return null;
  }
  const root = ensureModalRoot();
  if (!root) {
    return null;
  }
  return { contentRef, root };
};
