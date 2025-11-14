import { useRef } from "react";
import useViewportCoreState from "./useViewportCoreState.js";
import useViewportDerivedState from "./useViewportDerivedState.js";
import useViewportLifecycle from "./useViewportLifecycle.js";

const useViewportRefs = () => {
  const imageRef = useRef(null);
  const containerRef = useRef(null);
  return { imageRef, containerRef };
};

const useCoreState = () => useViewportCoreState();

const useDerivedState = ({ naturalSize, viewportSize, zoom, offset, setOffset }) =>
  useViewportDerivedState({
    naturalSize,
    viewportSize,
    zoom,
    offset,
    setOffset,
  });

const useLifecycleBindings = ({
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
};

const composeViewportModel = ({
  refs,
  coreState,
  derivedState,
}) => ({
  imageRef: refs.imageRef,
  containerRef: refs.containerRef,
  shouldRecenterRef: coreState.shouldRecenterRef,
  zoom: coreState.zoom,
  setZoom: coreState.setZoom,
  naturalSize: coreState.naturalSize,
  setNaturalSize: coreState.setNaturalSize,
  viewportSize: coreState.viewportSize,
  setViewportSize: coreState.setViewportSize,
  displayMetrics: derivedState.displayMetrics,
  bounds: derivedState.bounds,
  imageTransform: derivedState.imageTransform,
  offset: coreState.offset,
  resetView: coreState.resetView,
  recenterViewport: coreState.recenterViewport,
  applyOffsetDelta: derivedState.applyOffsetDelta,
});

const useAvatarViewportModel = ({ open, source }) => {
  const refs = useViewportRefs();
  const coreState = useCoreState();
  const derivedState = useDerivedState({
    naturalSize: coreState.naturalSize,
    viewportSize: coreState.viewportSize,
    zoom: coreState.zoom,
    offset: coreState.offset,
    setOffset: coreState.setOffset,
  });

  useLifecycleBindings({
    open,
    source,
    resetView: coreState.resetView,
    setNaturalSize: coreState.setNaturalSize,
    shouldRecenterRef: coreState.shouldRecenterRef,
    recenterViewport: coreState.recenterViewport,
    naturalSize: coreState.naturalSize,
    viewportSize: coreState.viewportSize,
    containerRef: refs.containerRef,
    setViewportSize: coreState.setViewportSize,
  });

  return composeViewportModel({
    refs,
    coreState,
    derivedState,
  });
};

export default useAvatarViewportModel;
