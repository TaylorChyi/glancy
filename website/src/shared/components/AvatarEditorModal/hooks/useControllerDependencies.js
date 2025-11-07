import useAvatarImageLoader from "./useAvatarImageLoader.js";
import useAvatarViewportModel from "./useAvatarViewportModel.js";
import usePointerControls from "./usePointerControls.js";
import useAvatarCropper from "./useAvatarCropper.js";
import useZoomControls from "./useZoomControls.js";

const useControllerDependencies = ({
  open,
  source,
  onConfirm,
  isProcessing,
}) => {
  const viewport = useAvatarViewportModel({ open, source });
  const pointer = usePointerControls({
    open,
    source,
    containerRef: viewport.containerRef,
    onOffsetChange: viewport.applyOffsetDelta,
  });
  const { handleImageLoad } = useAvatarImageLoader({
    source,
    viewportSize: viewport.viewportSize,
    setNaturalSize: viewport.setNaturalSize,
    recenterViewport: viewport.recenterViewport,
    shouldRecenterRef: viewport.shouldRecenterRef,
  });
  const { handleConfirm } = useAvatarCropper({
    imageRef: viewport.imageRef,
    displayMetrics: viewport.displayMetrics,
    viewportSize: viewport.viewportSize,
    naturalSize: viewport.naturalSize,
    offset: viewport.offset,
    onConfirm,
  });
  const zoomControls = useZoomControls({
    zoom: viewport.zoom,
    setZoom: viewport.setZoom,
    isProcessing,
  });

  return { viewport, pointer, zoomControls, handleConfirm, handleImageLoad };
};

export default useControllerDependencies;
