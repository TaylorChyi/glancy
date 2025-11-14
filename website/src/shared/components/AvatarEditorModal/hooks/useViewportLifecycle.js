import { useEffect, useLayoutEffect } from "react";
import {
  ensurePositiveNumber,
  hasPositiveDimensions,
  isPositiveNumber,
} from "./utils/viewportGuards.js";

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
    setNaturalSize({ width: 0, height: 0 });
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
    if (!hasPositiveDimensions({
      width: naturalSize.width,
      height: naturalSize.height,
    })) {
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

    const updateSize = () => {
      const nextSize = ensurePositiveNumber(element.clientWidth, 0);
      if (!isPositiveNumber(nextSize)) {
        return;
      }
      setViewportSize((previous) =>
        Math.abs(previous - nextSize) < 0.5 ? previous : nextSize,
      );
    };

    updateSize();

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
