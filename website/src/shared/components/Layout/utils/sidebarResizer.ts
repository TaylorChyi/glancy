import { MutableRefObject } from "react";

type SidebarBounds = {
  minWidth: number;
  maxWidth: number;
};

type ResizeFrame = MutableRefObject<number | null>;

type ResizeListenerParams = {
  event: PointerEvent;
  sidebarRef: MutableRefObject<HTMLDivElement | null>;
  containerRef: MutableRefObject<HTMLDivElement | null>;
  resizeFrame: ResizeFrame;
  setSidebarWidth: (value: number) => void;
};

const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value));

const readSidebarBounds = (container: HTMLElement): SidebarBounds => {
  const computed = window.getComputedStyle(container);
  const min = Number.parseFloat(computed.getPropertyValue("--layout-sidebar-min"));
  const max = Number.parseFloat(computed.getPropertyValue("--layout-sidebar-max"));
  return {
    minWidth: Number.isNaN(min) ? 240 : min,
    maxWidth: Number.isNaN(max) ? 420 : max,
  };
};

const stopAnimation = (frameRef: ResizeFrame) => {
  if (!frameRef.current) return;
  cancelAnimationFrame(frameRef.current);
  frameRef.current = null;
};

const scheduleWidthUpdate = (
  frameRef: ResizeFrame,
  setter: (value: number) => void,
  width: number,
) => {
  stopAnimation(frameRef);
  frameRef.current = requestAnimationFrame(() => setter(width));
};

export const attachSidebarResizeListeners = ({
  event,
  sidebarRef,
  containerRef,
  resizeFrame,
  setSidebarWidth,
}: ResizeListenerParams) => {
  event.preventDefault();
  const sidebar = sidebarRef.current;
  const container = containerRef.current;
  if (!sidebar || !container) return;
  document.body.style.userSelect = "none";
  const { width: initialWidth } = sidebar.getBoundingClientRect();
  const { minWidth, maxWidth } = readSidebarBounds(container);
  const startX = event.clientX;
  const handlePointerMove = (moveEvent: PointerEvent) => {
    const delta = moveEvent.clientX - startX;
    const width = clamp(initialWidth + delta, minWidth, maxWidth);
    scheduleWidthUpdate(resizeFrame, setSidebarWidth, width);
  };
  const handlePointerUp = () => {
    stopAnimation(resizeFrame);
    document.removeEventListener("pointermove", handlePointerMove);
    document.removeEventListener("pointerup", handlePointerUp);
    document.body.style.removeProperty("user-select");
  };
  document.addEventListener("pointermove", handlePointerMove);
  document.addEventListener("pointerup", handlePointerUp);
};

export type { ResizeListenerParams };
