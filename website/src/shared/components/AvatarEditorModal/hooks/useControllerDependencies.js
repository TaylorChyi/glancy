import useAvatarImageLoader from "./useAvatarImageLoader.js";
import useAvatarViewportModel from "./useAvatarViewportModel.js";
import usePointerControls from "./usePointerControls.js";
import useAvatarCropper from "./useAvatarCropper.js";
import useZoomControls from "./useZoomControls.js";

const usePointerDependency = ({ open, source, viewport }) =>
  usePointerControls({
    open,
    source,
    containerRef: viewport.containerRef,
    onOffsetChange: viewport.applyOffsetDelta,
  });

const useImageLoaderDependency = ({ source, viewport }) =>
  useAvatarImageLoader({
    source,
    viewportSize: viewport.viewportSize,
    setNaturalSize: viewport.setNaturalSize,
    recenterViewport: viewport.recenterViewport,
    shouldRecenterRef: viewport.shouldRecenterRef,
  });

const useCropConfirmDependency = ({ viewport, onConfirm }) =>
  useAvatarCropper({
    imageRef: viewport.imageRef,
    displayMetrics: viewport.displayMetrics,
    viewportSize: viewport.viewportSize,
    naturalSize: viewport.naturalSize,
    offset: viewport.offset,
    onConfirm,
  });

const useZoomDependency = ({ viewport, isProcessing }) =>
  useZoomControls({
    zoom: viewport.zoom,
    setZoom: viewport.setZoom,
    isProcessing,
  });

const useControllerDependencies = ({
  open,
  source,
  onConfirm,
  isProcessing,
}) => {
  const viewport = useAvatarViewportModel({ open, source });
  const pointer = usePointerDependency({ open, source, viewport });
  const { handleImageLoad } = useImageLoaderDependency({ source, viewport });
  const { handleConfirm } = useCropConfirmDependency({ viewport, onConfirm });
  const zoomControls = useZoomDependency({ viewport, isProcessing });

  return { viewport, pointer, zoomControls, handleConfirm, handleImageLoad };
};

export default useControllerDependencies;
