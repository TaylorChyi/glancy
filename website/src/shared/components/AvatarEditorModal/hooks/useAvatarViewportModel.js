import { useRef } from "react";
import useViewportCoreState from "./useViewportCoreState.js";
import useViewportDerivedState from "./useViewportDerivedState.js";
import useViewportLifecycle from "./useViewportLifecycle.js";

const useViewportRefs = () => {
  const imageRef = useRef(null);
  const containerRef = useRef(null);
  return { imageRef, containerRef };
};

const useDerivedViewportState = ({
  naturalSize,
  viewportSize,
  zoom,
  offset,
  setOffset,
}) =>
  useViewportDerivedState({
    naturalSize,
    viewportSize,
    zoom,
    offset,
    setOffset,
  });

const useViewportLifecycleEffects = ({
  open,
  source,
  core,
  refs,
}) => {
  useViewportLifecycle({
    open,
    source,
    resetView: core.resetView,
    setNaturalSize: core.setNaturalSize,
    shouldRecenterRef: core.shouldRecenterRef,
    recenterViewport: core.recenterViewport,
    naturalSize: core.naturalSize,
    viewportSize: core.viewportSize,
    containerRef: refs.containerRef,
    setViewportSize: core.setViewportSize,
  });
};

const composeViewportModel = ({ refs, core, derived }) => ({
  imageRef: refs.imageRef,
  containerRef: refs.containerRef,
  shouldRecenterRef: core.shouldRecenterRef,
  zoom: core.zoom,
  setZoom: core.setZoom,
  naturalSize: core.naturalSize,
  setNaturalSize: core.setNaturalSize,
  viewportSize: core.viewportSize,
  setViewportSize: core.setViewportSize,
  displayMetrics: derived.displayMetrics,
  bounds: derived.bounds,
  imageTransform: derived.imageTransform,
  offset: core.offset,
  resetView: core.resetView,
  recenterViewport: core.recenterViewport,
  applyOffsetDelta: derived.applyOffsetDelta,
});

const useAvatarViewportModel = ({ open, source }) => {
  const refs = useViewportRefs();
  const core = useViewportCoreState();
  const derived = useDerivedViewportState({
    naturalSize: core.naturalSize,
    viewportSize: core.viewportSize,
    zoom: core.zoom,
    offset: core.offset,
    setOffset: core.setOffset,
  });

  useViewportLifecycleEffects({ open, source, core, refs });

  return composeViewportModel({ refs, core, derived });
};

export default useAvatarViewportModel;
