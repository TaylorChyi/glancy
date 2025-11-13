import PropTypes from "prop-types";
import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import styles from "./Modal.module.css";
import { useEscapeKey } from "@shared/hooks";
import { withStopPropagation } from "@shared/utils/stopPropagation.js";

const MODAL_ROOT_ID = "glancy-modal-root";
let modalRoot;
let modalInstances = 0;
let previousBodyOverflow = "";
let previousBodyPaddingRight = "";

function ensureModalRoot() {
  if (typeof document === "undefined") {
    return null;
  }
  if (modalRoot && document.body.contains(modalRoot)) {
    return modalRoot;
  }

  const existing = document.getElementById(MODAL_ROOT_ID);
  if (existing) {
    modalRoot = existing;
    return modalRoot;
  }

  modalRoot = document.createElement("div");
  modalRoot.setAttribute("id", MODAL_ROOT_ID);
  document.body.appendChild(modalRoot);
  return modalRoot;
}

function lockBodyScroll() {
  if (typeof window === "undefined" || typeof document === "undefined") return;
  if (modalInstances === 0) {
    previousBodyOverflow = document.body.style.overflow;
    previousBodyPaddingRight = document.body.style.paddingRight;

    const scrollbarWidth =
      window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = "hidden";
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }
  }
  modalInstances += 1;
}

function unlockBodyScroll() {
  if (typeof window === "undefined" || typeof document === "undefined") return;
  modalInstances = Math.max(0, modalInstances - 1);
  if (modalInstances === 0) {
    document.body.style.overflow = previousBodyOverflow;
    document.body.style.paddingRight = previousBodyPaddingRight;
  }
}

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

const useBodyScrollLock = () => {
  useEffect(() => {
    const root = ensureModalRoot();
    if (!root) return undefined;
    lockBodyScroll();
    return () => unlockBodyScroll();
  }, []);
};

const useFocusTrap = (contentRef) => {
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
  }, []);
};

const renderCloseControl = ({
  closeButton,
  shouldRenderDefaultCloseButton,
  closeLabel,
  onClose,
}) => {
  if (closeButton) {
    return <div className={styles["close-slot"]}>{closeButton}</div>;
  }
  if (!shouldRenderDefaultCloseButton) {
    return null;
  }
  return (
    <button
      type="button"
      className={styles["close-button"]}
      aria-label={closeLabel}
      onClick={onClose}
    >
      <span aria-hidden="true">&times;</span>
    </button>
  );
};

function Modal({
  onClose,
  className = "",
  children,
  closeLabel = "Close",
  closeButton,
  hideDefaultCloseButton = false,
  ariaLabelledBy,
  ariaDescribedBy,
}) {
  useEscapeKey(onClose);
  const contentRef = useRef(null);
  useBodyScrollLock();
  useFocusTrap(contentRef);

  if (typeof document === "undefined") {
    return null;
  }

  const root = ensureModalRoot();
  if (!root) {
    return null;
  }

  const contentClassName = className
    ? `${styles.content} ${className}`
    : styles.content;

  const shouldRenderDefaultCloseButton =
    !hideDefaultCloseButton && !closeButton;

  return createPortal(
    <div className={styles.overlay} role="presentation" onClick={onClose}>
      <div
        className={contentClassName}
        role="dialog"
        aria-modal="true"
        aria-labelledby={ariaLabelledBy}
        aria-describedby={ariaDescribedBy}
        tabIndex={-1}
        ref={contentRef}
        onClick={withStopPropagation()}
      >
        {renderCloseControl({
          closeButton,
          shouldRenderDefaultCloseButton,
          closeLabel,
          onClose,
        })}
        {children}
      </div>
    </div>,
    root,
  );
}

Modal.propTypes = {
  onClose: PropTypes.func.isRequired,
  className: PropTypes.string,
  children: PropTypes.node.isRequired,
  closeLabel: PropTypes.string,
  closeButton: PropTypes.node,
  hideDefaultCloseButton: PropTypes.bool,
  ariaLabelledBy: PropTypes.string,
  ariaDescribedBy: PropTypes.string,
};

export default Modal;
