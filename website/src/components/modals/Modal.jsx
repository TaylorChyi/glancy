import PropTypes from "prop-types";
import { useEffect } from "react";
import { createPortal } from "react-dom";
import styles from "./Modal.module.css";
import { useEscapeKey } from "@/hooks";
import { withStopPropagation } from "@/utils/stopPropagation.js";

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

function Modal({ onClose, className = "", children, closeLabel = "Close" }) {
  useEscapeKey(onClose);

  useEffect(() => {
    const root = ensureModalRoot();
    if (!root) return undefined;

    lockBodyScroll();

    return () => {
      unlockBodyScroll();
    };
  }, []);

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

  return createPortal(
    <div className={styles.overlay} role="presentation" onClick={onClose}>
      <div
        className={contentClassName}
        role="dialog"
        aria-modal="true"
        onClick={withStopPropagation()}
      >
        <button
          type="button"
          className={styles["close-button"]}
          aria-label={closeLabel}
          onClick={onClose}
        >
          <span aria-hidden="true">&times;</span>
        </button>
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
};

export default Modal;
