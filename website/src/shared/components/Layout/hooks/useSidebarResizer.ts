import {
  MutableRefObject,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import { attachSidebarResizeListeners } from "../utils/sidebarResizer.js";

type UseSidebarResizerParams = {
  isMobile: boolean;
  containerRef: MutableRefObject<HTMLDivElement | null>;
};

type UseSidebarResizerResult = {
  sidebarRef: MutableRefObject<HTMLDivElement | null>;
  sidebarWidth: number | null;
  handlePointerDown: (event: ReactPointerEvent<HTMLDivElement>) => void;
};

const cleanupResizeFrame = (frameRef: MutableRefObject<number | null>) => {
  if (!frameRef.current) return;
  cancelAnimationFrame(frameRef.current);
  frameRef.current = null;
  document.body?.style?.removeProperty?.("user-select");
};

export const useSidebarResizer = ({
  isMobile,
  containerRef,
}: UseSidebarResizerParams): UseSidebarResizerResult => {
  const sidebarRef = useRef<HTMLDivElement | null>(null);
  const [sidebarWidth, setSidebarWidth] = useState<number | null>(null);
  const resizeFrame = useRef<number | null>(null);
  useEffect(() => {
    if (!isMobile) return;
    setSidebarWidth(null);
  }, [isMobile]);

  useEffect(() => () => cleanupResizeFrame(resizeFrame), []);
  const handlePointerDown = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (isMobile) return;
      attachSidebarResizeListeners({
        event: event.nativeEvent,
        sidebarRef,
        containerRef,
        resizeFrame,
        setSidebarWidth,
      });
    },
    [containerRef, isMobile],
  );
  return { sidebarRef, sidebarWidth, handlePointerDown };
};
