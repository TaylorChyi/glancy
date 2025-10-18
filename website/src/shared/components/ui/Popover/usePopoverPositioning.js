/**
 * 背景：
 *  - Popover 组件内部同时承担定位、事件订阅与渲染，职责过重且难以测试。
 * 目的：
 *  - 抽离定位与可见性状态为专用 Hook，便于后续在不同弹出层间共享能力。
 * 关键决策与取舍：
 *  - 将 requestAnimationFrame 与事件监听封装在 Hook 内，调用方仅需关注渲染；
 *  - 复用 resolvePopoverPosition 保持纯函数决策，降低副作用耦合度。
 * 影响范围：
 *  - 现有 Popover 组件；未来的浮层组件可直接复用该 Hook。
 * 演进与TODO：
 *  - 仍可进一步抽象 ResizeObserver 策略并提供配置化扩展点。
 */
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { resolvePopoverPosition } from "./placementStrategies";

const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

export function usePopoverPositioning({
  anchorRef,
  isOpen,
  placement,
  align,
  offset,
  fallbackPlacements,
  onClose,
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

    const resolution = resolvePopoverPosition({
      anchorRect,
      popRect,
      placement,
      fallbackPlacements,
      align,
      offset,
      viewport: { width: window.innerWidth, height: window.innerHeight },
    });

    if (!resolution) return;

    setPosition((prev) => {
      if (prev.top === resolution.top && prev.left === resolution.left) {
        return prev;
      }
      return { top: resolution.top, left: resolution.left };
    });
    setActivePlacement(resolution.placement);
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

  return {
    setContentNode,
    position,
    visible,
    activePlacement,
  };
}
