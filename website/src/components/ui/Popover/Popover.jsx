/**
 * 背景：
 *  - 语言切换等场景需要浮层在不同视窗高度下自如翻转，现有实现仅支持单一方向。
 * 目的：
 *  - 在 Popover 内部提供可扩展的定位策略，便于统一管理候选方向与间距计算。
 * 关键决策与取舍：
 *  - 采用策略映射（Strategy Pattern）封装不同方向的计算，避免调用方各自判断；
 *  - 优先在主轴空间不足时才尝试备用方向，以减小性能开销。
 * 影响范围：
 *  - 所有 Popover 调用方；新增 data-placement 便于调试与测试验证。
 * 演进与TODO：
 *  - 后续可扩展更多策略（如自动宽度自适应）并开放配置化入口。
 */
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

const PLACEMENT_CONFIG = {
  top: {
    axis: "vertical",
    compute(anchorRect, popRect, offset) {
      return {
        top: anchorRect.top - popRect.height - offset,
        left: anchorRect.left,
      };
    },
    fits({ top }, popRect) {
      if (typeof window === "undefined") return true;
      const bottom = top + popRect.height;
      return (
        top >= VIEWPORT_MARGIN &&
        bottom <= window.innerHeight - VIEWPORT_MARGIN
      );
    },
  },
  bottom: {
    axis: "vertical",
    compute(anchorRect, popRect, offset) {
      return {
        top: anchorRect.bottom + offset,
        left: anchorRect.left,
      };
    },
    fits({ top }, popRect) {
      if (typeof window === "undefined") return true;
      const bottom = top + popRect.height;
      return bottom <= window.innerHeight - VIEWPORT_MARGIN;
    },
  },
  left: {
    axis: "horizontal",
    compute(anchorRect, popRect, offset) {
      return {
        top: anchorRect.top,
        left: anchorRect.left - popRect.width - offset,
      };
    },
    fits({ left }, popRect) {
      if (typeof window === "undefined") return true;
      const right = left + popRect.width;
      return left >= VIEWPORT_MARGIN && right <= window.innerWidth - VIEWPORT_MARGIN;
    },
  },
  right: {
    axis: "horizontal",
    compute(anchorRect, popRect, offset) {
      return {
        top: anchorRect.top,
        left: anchorRect.right + offset,
      };
    },
    fits({ left }, popRect) {
      if (typeof window === "undefined") return true;
      const right = left + popRect.width;
      return right <= window.innerWidth - VIEWPORT_MARGIN;
    },
  },
};

function Popover({
  anchorRef,
  isOpen,
  children,
  onClose,
  placement = "bottom",
  align = "start",
  offset = 8,
  fallbackPlacements = [],
  className,
  style,
}) {
  const contentRef = useRef(null);
  const frameRef = useRef(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [visible, setVisible] = useState(false);
  const [activePlacement, setActivePlacement] = useState(placement);

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

    const candidatePlacements = [placement, ...fallbackPlacements];

    let resolution = null;

    for (const candidate of candidatePlacements) {
      const config = PLACEMENT_CONFIG[candidate];
      if (!config) {
        continue;
      }
      const basePosition = config.compute(anchorRect, popRect, offset);
      const nextResolution = {
        placement: candidate,
        axis: config.axis,
        position: basePosition,
      };
      if (!resolution) {
        resolution = nextResolution;
      }
      if (config.fits(basePosition, popRect)) {
        resolution = nextResolution;
        break;
      }
    }

    if (!resolution) {
      resolution = {
        placement,
        axis: "vertical",
        position: { top: anchorRect.bottom + offset, left: anchorRect.left },
      };
    }

    let { top, left } = resolution.position;
    const resolvedPlacement = resolution.placement;
    const isVerticalAxis = resolution.axis === "vertical";

    if (isVerticalAxis) {
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

    if (isVerticalAxis) {
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
    setActivePlacement(resolvedPlacement);
    setVisible(true);
  }, [align, anchorRef, fallbackPlacements, isOpen, offset, placement]);

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

  useEffect(() => {
    if (!isOpen) {
      setActivePlacement(placement);
    }
  }, [isOpen, placement]);

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
      data-placement={activePlacement}
      style={inlineStyles}
    >
      {children}
    </div>,
    document.body,
  );
}

export default Popover;
