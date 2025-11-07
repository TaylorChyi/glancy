import { useRef } from "react";
import useViewportCoreState from "./useViewportCoreState.js";
import useViewportDerivedState from "./useViewportDerivedState.js";
import useViewportLifecycle from "./useViewportLifecycle.js";

const useAvatarViewportModel = ({ open, source }) => {
  const imageRef = useRef(null);
  const containerRef = useRef(null);

  const {
    shouldRecenterRef,
    zoom,
    setZoom,
    offset,
    setOffset,
    naturalSize,
    setNaturalSize,
    viewportSize,
    setViewportSize,
    resetView,
    recenterViewport,
  } = useViewportCoreState();

  const { displayMetrics, bounds, applyOffsetDelta, imageTransform } =
    useViewportDerivedState({
      naturalSize,
      viewportSize,
      zoom,
      offset,
      setOffset,
    });

  useViewportLifecycle({
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
  });

  return {
    imageRef,
    containerRef,
    shouldRecenterRef,
    zoom,
    setZoom,
    naturalSize,
    setNaturalSize,
    viewportSize,
    setViewportSize,
    displayMetrics,
    bounds,
    imageTransform,
    offset,
    resetView,
    recenterViewport,
    applyOffsetDelta,
  };
};

export default useAvatarViewportModel;
