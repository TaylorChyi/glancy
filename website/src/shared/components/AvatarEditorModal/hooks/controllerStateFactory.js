const controllerStateFactory = ({
  viewport,
  pointer,
  zoomControls,
  mergedLabels,
  handleConfirm,
  handleImageLoad,
}) => ({
  mergedLabels,
  imageTransform: viewport.imageTransform,
  imageRef: viewport.imageRef,
  containerRef: viewport.containerRef,
  handlePointerDown: pointer.handlePointerDown,
  handlePointerMove: pointer.handlePointerMove,
  handlePointerUp: pointer.handlePointerUp,
  handleZoomIn: zoomControls.handleZoomIn,
  handleZoomOut: zoomControls.handleZoomOut,
  isZoomInDisabled: zoomControls.isZoomInDisabled,
  isZoomOutDisabled: zoomControls.isZoomOutDisabled,
  handleConfirm,
  handleImageLoad,
});

export default controllerStateFactory;
