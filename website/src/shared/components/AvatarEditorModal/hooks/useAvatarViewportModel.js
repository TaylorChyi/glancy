import useViewportCoreState from "./useViewportCoreState.js";
import useViewportDerivedState from "./useViewportDerivedState.js";
import useViewportLifecycle from "./useViewportLifecycle.js";
import useViewportRefs from "./useViewportRefs.js";

const useAvatarViewportModel = ({ open, source }) => {
  const refs = useViewportRefs();
  const coreState = useViewportCoreState();
  const derivedState = useViewportDerivedState({
    naturalSize: coreState.naturalSize,
    viewportSize: coreState.viewportSize,
    zoom: coreState.zoom,
    offset: coreState.offset,
    setOffset: coreState.setOffset,
  });

  useViewportLifecycle({
    open,
    source,
    containerRef: refs.containerRef,
    resetView: coreState.resetView,
    setNaturalSize: coreState.setNaturalSize,
    shouldRecenterRef: coreState.shouldRecenterRef,
    recenterViewport: coreState.recenterViewport,
    naturalSize: coreState.naturalSize,
    viewportSize: coreState.viewportSize,
    setViewportSize: coreState.setViewportSize,
  });

  return { ...refs, ...coreState, ...derivedState };
};

export default useAvatarViewportModel;
