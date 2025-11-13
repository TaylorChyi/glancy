import useAvatarImageLoader from "./useAvatarImageLoader.js";
import useAvatarViewportModel from "./useAvatarViewportModel.js";
import usePointerControls from "./usePointerControls.js";
import useAvatarCropper from "./useAvatarCropper.js";
import useZoomControls from "./useZoomControls.js";

const useViewportDependencies = ({ open, source }) =>
  useAvatarViewportModel({ open, source });

const usePointerDependencies = ({ open, source, viewport }) =>
  usePointerControls({
    open,
    source,
    containerRef: viewport.containerRef,
    onOffsetChange: viewport.applyOffsetDelta,
  });

const useImageLoaderDependencies = ({ source, viewport }) =>
  useAvatarImageLoader({
    source,
    viewportSize: viewport.viewportSize,
    setNaturalSize: viewport.setNaturalSize,
    recenterViewport: viewport.recenterViewport,
    shouldRecenterRef: viewport.shouldRecenterRef,
  });

const useCropperDependencies = ({ viewport, onConfirm }) =>
  useAvatarCropper({
    imageRef: viewport.imageRef,
    displayMetrics: viewport.displayMetrics,
    viewportSize: viewport.viewportSize,
    naturalSize: viewport.naturalSize,
    offset: viewport.offset,
    onConfirm,
  });

const useZoomDependencies = ({ viewport, isProcessing }) =>
  useZoomControls({
    zoom: viewport.zoom,
    setZoom: viewport.setZoom,
    isProcessing,
  });

const composeControllerResult = ({
  viewport,
  pointer,
  zoomControls,
  handleConfirm,
  handleImageLoad,
}) => ({ viewport, pointer, zoomControls, handleConfirm, handleImageLoad });

const useControllerDependencies = ({
  open,
  source,
  onConfirm,
  isProcessing,
}) => {
  const viewport = useViewportDependencies({ open, source });
  const pointer = usePointerDependencies({ open, source, viewport });
  const { handleImageLoad } = useImageLoaderDependencies({ source, viewport });
  const { handleConfirm } = useCropperDependencies({ viewport, onConfirm });
  const zoomControls = useZoomDependencies({ viewport, isProcessing });

  return composeControllerResult({
    viewport,
    pointer,
    zoomControls,
    handleConfirm,
    handleImageLoad,
  });
};

export default useControllerDependencies;
