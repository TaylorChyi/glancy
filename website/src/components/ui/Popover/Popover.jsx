import { createPortal } from "react-dom";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import styles from "./Popover.module.css";

const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

const VIEWPORT_MARGIN = 8;

function clamp(value, min, max) {
  if (min > max) {
    return value;
  }
  if (value < min) return min;
  if (value > max) return max;
  return value;
}

function Popover({
  anchorRef,
  isOpen,
  children,
  onClose,
  placement = "bottom",
  align = "start",
  offset = 8,
  className,
  style,
}) {
  const contentRef = useRef(null);
  const frameRef = useRef(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [visible, setVisible] = useState(false);

  const setContentNode = useCallback((node) => {
    contentRef.current = node;
  }, []);

  const clearFrame = useCallback(() => {
    if (frameRef.current) {
      cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }
  }, []);

  const applyPosition = useCallback(() => {
    if (!isOpen || typeof window === "undefined") return;

    const anchorEl = anchorRef?.current;
    const popoverEl = contentRef.current;
    if (!anchorEl || !popoverEl) return;

    const anchorRect = anchorEl.getBoundingClientRect();
    const popRect = popoverEl.getBoundingClientRect();

    let top;
    let left;

    switch (placement) {
      case "top":
        top = anchorRect.top - popRect.height - offset;
        left = anchorRect.left;
        break;
      case "left":
        top = anchorRect.top;
        left = anchorRect.left - popRect.width - offset;
        break;
      case "right":
        top = anchorRect.top;
        left = anchorRect.right + offset;
        break;
      case "bottom":
      default:
        top = anchorRect.bottom + offset;
        left = anchorRect.left;
        break;
    }

    const horizontalPlacement = placement === "bottom" || placement === "top";

    if (horizontalPlacement) {
      if (align === "center") {
        left = anchorRect.left + anchorRect.width / 2 - popRect.width / 2;
      } else if (align === "end") {
        left = anchorRect.right - popRect.width;
      }
    } else if (align === "center") {
      top = anchorRect.top + anchorRect.height / 2 - popRect.height / 2;
    } else if (align === "end") {
      top = anchorRect.bottom - popRect.height;
    }

    if (horizontalPlacement) {
      const minLeft = VIEWPORT_MARGIN;
      const maxLeft = window.innerWidth - popRect.width - VIEWPORT_MARGIN;
      left = clamp(left, minLeft, maxLeft);
    } else {
      const minTop = VIEWPORT_MARGIN;
      const maxTop = window.innerHeight - popRect.height - VIEWPORT_MARGIN;
      top = clamp(top, minTop, maxTop);
      const minLeft = VIEWPORT_MARGIN;
      const maxLeft = window.innerWidth - popRect.width - VIEWPORT_MARGIN;
      left = clamp(left, minLeft, maxLeft);
    }

    setPosition((prev) => {
      if (prev.top === top && prev.left === left) {
        return prev;
      }
      return { top, left };
    });
    setVisible(true);
  }, [align, anchorRef, isOpen, offset, placement]);

  const scheduleUpdate = useCallback(() => {
    if (!isOpen || typeof window === "undefined") return;
    clearFrame();
    frameRef.current = requestAnimationFrame(() => {
      frameRef.current = null;
      applyPosition();
    });
  }, [applyPosition, clearFrame, isOpen]);

  useIsomorphicLayoutEffect(() => {
    if (!isOpen) return undefined;
    scheduleUpdate();
    return () => {
      clearFrame();
    };
  }, [clearFrame, isOpen, scheduleUpdate]);

  useEffect(() => {
    if (!isOpen) return undefined;

    setVisible(false);

    const handleResize = () => {
      scheduleUpdate();
    };

    const handleScroll = () => {
      scheduleUpdate();
    };

    const handlePointerDown = (event) => {
      const anchorEl = anchorRef?.current;
      const popoverEl = contentRef.current;
      if (popoverEl?.contains(event.target)) return;
      if (anchorEl?.contains(event.target)) return;
      onClose?.();
    };

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        onClose?.();
      }
    };

    const anchorEl = anchorRef?.current;
    const popoverEl = contentRef.current;
    const resizeObserver =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(() => scheduleUpdate())
        : null;

    window.addEventListener("resize", handleResize);
    window.addEventListener("scroll", handleScroll, true);
    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    if (resizeObserver) {
      if (anchorEl) resizeObserver.observe(anchorEl);
      if (popoverEl) resizeObserver.observe(popoverEl);
    }

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("scroll", handleScroll, true);
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
      resizeObserver?.disconnect();
    };
  }, [anchorRef, isOpen, onClose, scheduleUpdate]);

  useEffect(() => () => clearFrame(), [clearFrame]);

  useEffect(() => {
    if (!isOpen) {
      setVisible(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;
  if (typeof document === "undefined") return null;

  const classNames = [styles.popover, className].filter(Boolean).join(" ");
  const inlineStyles = {
    top: `${position.top}px`,
    left: `${position.left}px`,
    ...style,
  };

  return createPortal(
    <div
      ref={setContentNode}
      className={classNames}
      data-visible={visible}
      style={inlineStyles}
    >
      {children}
    </div>,
    document.body,
  );
}

export default Popover;
