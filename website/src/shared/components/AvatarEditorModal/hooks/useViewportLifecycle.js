/**
 * 背景：
 *  - 视口相关副作用（监听可见性、关闭重置、尺寸同步等）分散在主 hook 内。
 * 目的：
 *  - 集中封装副作用，确保 useAvatarViewportModel 仅负责组合与输出。
 * 关键决策与取舍：
 *  - 维持单一出口 useViewportLifecycle，并在内部复用子 effect；
 *  - 默认依赖浏览器 API（ResizeObserver/window），对 SSR 环境友好。
 * 影响范围：
 *  - AvatarEditorModal 的视口生命周期管理。
 * 演进与TODO：
 *  - 后续可在此扩展键盘或可访问性相关副作用。 
 */

import { useEffect, useLayoutEffect } from "react";

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
      const nextSize = element.clientWidth;
      if (!Number.isFinite(nextSize) || nextSize <= 0) {
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
