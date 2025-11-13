import { useEffect, useRef } from "react";

const FOCUSABLE_SELECTOR =
  'a[href], area[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), iframe, object, embed, [tabindex]:not([tabindex="-1"]), [contenteditable="true"]';

const toFocusableElements = (root) => {
  if (!root) {
    return [];
  }
  const nodes = root.querySelectorAll(FOCUSABLE_SELECTOR);
  return Array.from(nodes).filter((element) => {
    if (!(element instanceof HTMLElement)) {
      return false;
    }
    if (element.hasAttribute("disabled")) {
      return false;
    }
    if (element.tabIndex === -1) {
      return false;
    }
    const hasLayout =
      element.offsetParent !== null || element.getClientRects().length > 0;
    return hasLayout;
  });
};

export const useModalFocusTrap = (contentRef) => {
  const previousFocusRef = useRef(null);

  useEffect(() => {
    const content = contentRef.current;
    if (!content) {
      return undefined;
    }

    if (typeof document !== "undefined") {
      const activeElement = document.activeElement;
      if (activeElement instanceof HTMLElement) {
        previousFocusRef.current = activeElement;
      }
    }

    const focusables = toFocusableElements(content);
    const focusTarget = focusables[0] ?? content;
    requestAnimationFrame(() => {
      focusTarget.focus({ preventScroll: true });
    });

    const handleKeyDown = (event) => {
      if (event.key !== "Tab") {
        return;
      }

      const elements = toFocusableElements(content);
      if (elements.length === 0) {
        event.preventDefault();
        return;
      }

      const first = elements[0];
      const last = elements[elements.length - 1];
      const active = document.activeElement;

      if (event.shiftKey) {
        if (active === first || !content.contains(active)) {
          event.preventDefault();
          last.focus();
        }
        return;
      }

      if (active === last) {
        event.preventDefault();
        first.focus();
      }
    };

    content.addEventListener("keydown", handleKeyDown);

    return () => {
      content.removeEventListener("keydown", handleKeyDown);
      const previous = previousFocusRef.current;
      if (previous && typeof previous.focus === "function") {
        previous.focus({ preventScroll: true });
      }
    };
  }, [contentRef]);
};
