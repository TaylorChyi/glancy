import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import PropTypes from "prop-types";
import styles from "./Popover.module.css";

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])';

function getFocusableNodes(container) {
  if (!container) return [];
  return Array.from(container.querySelectorAll(FOCUSABLE_SELECTOR)).filter(
    (element) => !element.hasAttribute("data-disabled"),
  );
}

function Popover({ renderTrigger, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  const containerRef = useRef(null);
  const panelRef = useRef(null);
  const triggerRef = useRef(null);
  const content = useMemo(
    () =>
      typeof children === "function"
        ? children({ close: () => setOpen(false) })
        : children,
    [children],
  );

  useEffect(() => {
    if (!open) return undefined;

    const handlePointerDown = (event) => {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(event.target)) {
        setOpen(false);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  useEffect(() => {
    if (!open) {
      if (triggerRef.current) {
        triggerRef.current.focus();
      }
      return;
    }

    const panelNode = panelRef.current;
    if (!panelNode) return;
    const focusable = getFocusableNodes(panelNode);

    if (focusable.length > 0) {
      focusable[0].focus();
    } else {
      panelNode.focus();
    }
  }, [open]);

  const handleKeyDown = useCallback((event) => {
    if (event.key !== "Tab") return;
    const panelNode = panelRef.current;
    if (!panelNode) return;
    const focusable = getFocusableNodes(panelNode);
    if (focusable.length === 0) {
      event.preventDefault();
      return;
    }

    const currentIndex = focusable.indexOf(document.activeElement);
    const lastIndex = focusable.length - 1;

    if (event.shiftKey) {
      if (currentIndex <= 0) {
        focusable[lastIndex].focus();
        event.preventDefault();
      }
      return;
    }

    if (currentIndex === lastIndex) {
      focusable[0].focus();
      event.preventDefault();
    }
  }, []);

  const triggerProps = {
    ref: triggerRef,
    "aria-expanded": open,
    "aria-haspopup": "dialog",
    onClick: () => {
      setOpen((previous) => !previous);
    },
  };

  return (
    <div ref={containerRef} className={styles.container} data-open={open}>
      {renderTrigger({
        open,
        setOpen,
        ref: triggerRef,
        props: triggerProps,
      })}
      {open ? (
        <div
          ref={panelRef}
          className={styles.panel}
          role="dialog"
          tabIndex={-1}
          onKeyDown={handleKeyDown}
        >
          {content}
        </div>
      ) : null}
    </div>
  );
}

Popover.propTypes = {
  renderTrigger: PropTypes.func.isRequired,
  children: PropTypes.oneOfType([PropTypes.node, PropTypes.func]).isRequired,
  defaultOpen: PropTypes.bool,
};

Popover.defaultProps = {
  defaultOpen: false,
};

export default Popover;
