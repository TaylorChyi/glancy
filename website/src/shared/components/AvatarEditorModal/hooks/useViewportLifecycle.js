import { useEffect, useLayoutEffect } from "react";
import { ensurePositiveFinite, shouldUpdateDimension } from "./viewportMath.js";

const resetNaturalDimensions = (setNaturalSize) => {
  setNaturalSize({ width: 0, height: 0 });
};

const updateViewportSize = ({ element, setViewportSize }) => {
  const nextSize = ensurePositiveFinite(element.clientWidth);
  if (!nextSize) {
    return;
  }
  setViewportSize((previous) =>
    shouldUpdateDimension(previous, nextSize) ? nextSize : previous,
  );
};

const observeViewportElement = ({ element, updateSize }) => {
  if (typeof ResizeObserver === "function") {
    const observer = new ResizeObserver(() => updateSize());
    observer.observe(element);
    return () => observer.disconnect();
  }

  if (typeof window !== "undefined") {
    window.addEventListener("resize", updateSize);
    return () => {
      window.removeEventListener("resize", updateSize);
    };
  }

  return undefined;
};

const useRecenterOnVisibility = ({ open, resetView, source }) => {
  useLayoutEffect(() => {
    if (!open) {
      return;
    }
    resetView();
  }, [open, resetView, source]);
};

const useCleanupOnClose = ({ open, resetView, setNaturalSize }) => {
  useEffect(() => {
    if (open) {
      return;
    }
    resetView();
    resetNaturalDimensions(setNaturalSize);
  }, [open, resetView, setNaturalSize]);
};

const useReadyRecenter = ({
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

const useViewportResizeSync = ({ open, containerRef, setViewportSize }) => {
  useEffect(() => {
    if (!open) {
      return undefined;
    }
    const element = containerRef.current;
    if (!element) {
      return undefined;
    }
    const updateSize = () =>
      updateViewportSize({ element, setViewportSize });

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
  useRecenterOnVisibility({ open, resetView, source });
  useCleanupOnClose({ open, resetView, setNaturalSize });
  useReadyRecenter({
    open,
    shouldRecenterRef,
    recenterViewport,
    naturalSize,
    viewportSize,
    source,
  });
  useViewportResizeSync({ open, containerRef, setViewportSize });
};

export default useViewportLifecycle;
