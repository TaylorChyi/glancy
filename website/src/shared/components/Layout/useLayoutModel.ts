import {
  CSSProperties,
  MutableRefObject,
  ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import { useIsMobile } from "@shared/utils/device.js";

const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value));

const resolveSidebarBounds = (container: HTMLElement) => {
  const computed = window.getComputedStyle(container);
  const min = Number.parseFloat(
    computed.getPropertyValue("--layout-sidebar-min"),
  );
  const max = Number.parseFloat(
    computed.getPropertyValue("--layout-sidebar-max"),
  );
  return {
    minWidth: Number.isNaN(min) ? 240 : min,
    maxWidth: Number.isNaN(max) ? 420 : max,
  };
};

type ResizeListenerParams = {
  event: PointerEvent;
  sidebarRef: MutableRefObject<HTMLDivElement | null>;
  containerRef: MutableRefObject<HTMLDivElement | null>;
  resizeFrame: MutableRefObject<number | null>;
  setSidebarWidth: (value: number) => void;
};

const attachSidebarResizeListeners = ({
  event,
  sidebarRef,
  containerRef,
  resizeFrame,
  setSidebarWidth,
}: ResizeListenerParams) => {
  event.preventDefault();
  if (!sidebarRef.current || !containerRef.current) {
    return;
  }
  document.body.style.userSelect = "none";
  const { width: initialWidth } = sidebarRef.current.getBoundingClientRect();
  const { minWidth, maxWidth } = resolveSidebarBounds(containerRef.current);
  const startX = event.clientX;

  const handlePointerMove = (moveEvent: PointerEvent) => {
    if (resizeFrame.current) {
      cancelAnimationFrame(resizeFrame.current);
      resizeFrame.current = null;
    }
    resizeFrame.current = requestAnimationFrame(() => {
      const delta = moveEvent.clientX - startX;
      const nextWidth = clamp(initialWidth + delta, minWidth, maxWidth);
      setSidebarWidth(nextWidth);
    });
  };

  const handlePointerUp = () => {
    if (resizeFrame.current) {
      cancelAnimationFrame(resizeFrame.current);
      resizeFrame.current = null;
    }
    document.removeEventListener("pointermove", handlePointerMove);
    document.removeEventListener("pointerup", handlePointerUp);
    document.body.style.removeProperty("user-select");
  };

  document.addEventListener("pointermove", handlePointerMove);
  document.addEventListener("pointerup", handlePointerUp);
};

const useSidebarResizer = (
  isMobile: boolean,
  containerRef: MutableRefObject<HTMLDivElement | null>,
) => {
  const sidebarRef = useRef<HTMLDivElement | null>(null);
  const [sidebarWidth, setSidebarWidth] = useState<number | null>(null);
  const resizeFrame = useRef<number | null>(null);

  useEffect(() => {
    if (isMobile) {
      setSidebarWidth(null);
    }
  }, [isMobile]);

  useEffect(
    () => () => {
      if (resizeFrame.current) {
        cancelAnimationFrame(resizeFrame.current);
        resizeFrame.current = null;
      }
      document.body?.style?.removeProperty?.("user-select");
    },
    [],
  );

  const handlePointerDown = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (isMobile) return;
      if (!sidebarRef.current || !containerRef.current) return;
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

const useMainScrollRef = (
  onMainMiddleScroll?: (event: Event) => void,
): MutableRefObject<HTMLElement | null> => {
  const contentRef = useRef<HTMLElement | null>(null);
  useEffect(() => {
    if (!onMainMiddleScroll) {
      return undefined;
    }
    const node = contentRef.current;
    if (!node) {
      return undefined;
    }
    const handleScroll = (event: Event) => {
      onMainMiddleScroll(event);
    };
    node.addEventListener("scroll", handleScroll);
    return () => node.removeEventListener("scroll", handleScroll);
  }, [contentRef, onMainMiddleScroll]);
  return contentRef;
};

const useDockerMeasurements = (shouldRenderDocker: boolean) => {
  const dockerRef = useRef<HTMLDivElement | null>(null);
  const [dockerHeight, setDockerHeight] = useState(0);

  useEffect(() => {
    if (!shouldRenderDocker) {
      setDockerHeight((prev) => (prev === 0 ? prev : 0));
      return undefined;
    }
    const node = dockerRef.current;
    if (!node || typeof ResizeObserver === "undefined") {
      return undefined;
    }
    const observer = new ResizeObserver((entries) => {
      const entry = entries?.[0];
      if (!entry) return;
      const nextHeight = Math.round(entry.contentRect.height);
      setDockerHeight((prev) => (prev === nextHeight ? prev : nextHeight));
    });
    observer.observe(node);
    return () => {
      observer.disconnect();
      setDockerHeight((prev) => (prev === 0 ? prev : 0));
    };
  }, [dockerRef, shouldRenderDocker]);

  return { dockerRef, dockerHeight };
};

type LayoutModelInput = {
  children: ReactNode;
  sidebarProps?: Record<string, unknown>;
  bottomContent?: ReactNode;
  onMainMiddleScroll?: (event: Event) => void;
};

export type LayoutViewModel = {
  viewProps: {
    containerRef: MutableRefObject<HTMLDivElement | null>;
    containerStyle: CSSProperties;
    sidebar: {
      ref: MutableRefObject<HTMLDivElement | null>;
      props: Record<string, unknown>;
    };
    resizer: {
      visible: boolean;
      onPointerDown: (event: ReactPointerEvent<HTMLDivElement>) => void;
    };
    main: {
      isMobile: boolean;
      onToggleSidebar: () => void;
      contentRef: MutableRefObject<HTMLElement | null>;
      children: ReactNode;
    };
    docker: {
      shouldRender: boolean;
      dockerRef: MutableRefObject<HTMLDivElement | null>;
      content: ReactNode;
    };
  };
};

export const useLayoutModel = ({
  children,
  sidebarProps = {},
  bottomContent = null,
  onMainMiddleScroll,
}: LayoutModelInput): LayoutViewModel => {
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const shouldRenderDocker = Boolean(bottomContent);
  const { sidebarRef, sidebarWidth, handlePointerDown } = useSidebarResizer(
    isMobile,
    containerRef,
  );
  const contentRef = useMainScrollRef(onMainMiddleScroll);
  const { dockerRef, dockerHeight } = useDockerMeasurements(
    shouldRenderDocker,
  );

  const handleSidebarClose = useCallback(() => {
    setSidebarOpen(false);
    const onClose = sidebarProps?.onClose;
    if (typeof onClose === "function") {
      onClose();
    }
  }, [sidebarProps]);

  const handleSidebarOpen = useCallback(() => {
    setSidebarOpen(true);
  }, []);

  const containerStyle = useMemo(() => {
    const resolvedDockerHeight = shouldRenderDocker ? dockerHeight : 0;
    const style: CSSProperties = {
      "--docker-h": `${resolvedDockerHeight}px`,
    };
    if (!isMobile && typeof sidebarWidth === "number") {
      style["--sidebar-w"] = `${Math.round(sidebarWidth)}px`;
    }
    return style;
  }, [dockerHeight, isMobile, sidebarWidth, shouldRenderDocker]);

  const mergedSidebarProps = useMemo(
    () => ({
      ...sidebarProps,
      open: sidebarOpen,
      onClose: handleSidebarClose,
      isMobile,
    }),
    [handleSidebarClose, isMobile, sidebarProps, sidebarOpen],
  );

  return {
    viewProps: {
      containerRef,
      containerStyle,
      sidebar: {
        ref: sidebarRef,
        props: mergedSidebarProps,
      },
      resizer: {
        visible: !isMobile,
        onPointerDown: handlePointerDown,
      },
      main: {
        isMobile,
        onToggleSidebar: handleSidebarOpen,
        contentRef,
        children,
      },
      docker: {
        shouldRender: shouldRenderDocker,
        dockerRef,
        content: bottomContent,
      },
    },
  };
};

export default useLayoutModel;
