import { useEffect, useLayoutEffect } from "react";

export const useViewportResetOnOpen = ({ open, resetView, source }) => {
  useLayoutEffect(() => {
    if (!open) {
      return;
    }
    resetView();
  }, [open, resetView, source]);
};

export const useViewportCleanup = ({ open, resetView, setNaturalSize }) => {
  useEffect(() => {
    if (open) {
      return;
    }
    resetView();
    setNaturalSize({ width: 0, height: 0 });
  }, [open, resetView, setNaturalSize]);
};

export const useReadyViewportRecentering = ({
  open,
  shouldRecenterRef,
  recenterViewport,
  naturalSize,
  viewportSize,
  source,
}) => {
  useEffect(() => {
    if (!open || !shouldRecenterRef.current) {
      return;
    }
    recenterViewport({
      naturalWidth: naturalSize.width,
      naturalHeight: naturalSize.height,
      viewport: viewportSize,
    });
  }, [
    naturalSize.height,
    naturalSize.width,
    open,
    recenterViewport,
    shouldRecenterRef,
    viewportSize,
    source,
  ]);
};

const observeViewportElement = ({ element, updateSize }) => {
  if (typeof ResizeObserver === "function") {
    const observer = new ResizeObserver(() => updateSize());
    observer.observe(element);
    return () => observer.disconnect();
  }

  if (typeof window !== "undefined") {
    const handleResize = () => updateSize();
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }

  return undefined;
};

const createViewportSizeUpdater = ({ element, setViewportSize }) => () => {
  const nextSize = element.clientWidth;
  if (!Number.isFinite(nextSize) || nextSize <= 0) {
    return;
  }
  setViewportSize((previous) =>
    Math.abs(previous - nextSize) < 0.5 ? previous : nextSize,
  );
};

export const useViewportResizeObserver = ({
  open,
  containerRef,
  setViewportSize,
}) => {
  useEffect(() => {
    if (!open) {
      return undefined;
    }
    const element = containerRef.current;
    if (!element) {
      return undefined;
    }

    const updateSize = createViewportSizeUpdater({ element, setViewportSize });
    updateSize();
    return observeViewportElement({ element, updateSize });
  }, [containerRef, open, setViewportSize]);
};

const useViewportLifecycle = ({
  open,
  source,
  resetView,
  setNaturalSize,
  shouldRecenterRef,
  recenterViewport,
  naturalSize,
  viewportSize,
  containerRef,
  setViewportSize,
}) => {
  useViewportResetOnOpen({ open, resetView, source });
  useViewportCleanup({ open, resetView, setNaturalSize });
  useReadyViewportRecentering({
    open,
    shouldRecenterRef,
    recenterViewport,
    naturalSize,
    viewportSize,
    source,
  });
  useViewportResizeObserver({ open, containerRef, setViewportSize });
};

export default useViewportLifecycle;
