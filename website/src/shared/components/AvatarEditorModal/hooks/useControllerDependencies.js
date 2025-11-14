import useAvatarImageLoader from "./useAvatarImageLoader.js";
import useAvatarViewportModel from "./useAvatarViewportModel.js";
import usePointerControls from "./usePointerControls.js";
import useAvatarCropper from "./useAvatarCropper.js";
import useZoomControls from "./useZoomControls.js";

const useViewport = ({ open, source }) =>
  useAvatarViewportModel({ open, source });

const usePointer = ({ open, source }, viewport) =>
  usePointerControls({
    open,
    source,
    containerRef: viewport.containerRef,
    onOffsetChange: viewport.applyOffsetDelta,
  });

const useImageLoader = ({ source }, viewport) =>
  useAvatarImageLoader({
    source,
    viewportSize: viewport.viewportSize,
    setNaturalSize: viewport.setNaturalSize,
    recenterViewport: viewport.recenterViewport,
    shouldRecenterRef: viewport.shouldRecenterRef,
  });

const useCropper = ({ onConfirm }, viewport) =>
  useAvatarCropper({
    imageRef: viewport.imageRef,
    displayMetrics: viewport.displayMetrics,
    viewportSize: viewport.viewportSize,
    naturalSize: viewport.naturalSize,
    offset: viewport.offset,
    onConfirm,
  });

const useZoom = ({ isProcessing }, viewport) =>
  useZoomControls({
    zoom: viewport.zoom,
    setZoom: viewport.setZoom,
    isProcessing,
  });

const composeDependencies = ({ viewport, pointer, zoomControls, cropper, loader }) => ({
  viewport,
  pointer,
  zoomControls,
  handleConfirm: cropper.handleConfirm,
  handleImageLoad: loader.handleImageLoad,
});

const useControllerDependencies = ({
  open,
  source,
  onConfirm,
  isProcessing,
}) => {
  const viewport = useViewport({ open, source });
  const pointer = usePointer({ open, source }, viewport);
  const loader = useImageLoader({ source }, viewport);
  const cropper = useCropper({ onConfirm }, viewport);
  const zoomControls = useZoom({ isProcessing }, viewport);

  return composeDependencies({
    viewport,
    pointer,
    zoomControls,
    cropper,
    loader,
  });
};

export default useControllerDependencies;
