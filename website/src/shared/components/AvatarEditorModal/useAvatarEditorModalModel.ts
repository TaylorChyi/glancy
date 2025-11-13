import useAvatarEditorController from "./hooks/useAvatarEditorController.js";

type AvatarEditorModalInput = {
  open: boolean;
  source?: string;
  onCancel: () => void;
  onConfirm: (data: unknown) => void;
  labels?: Record<string, string>;
  isProcessing?: boolean;
};

export const useAvatarEditorModalModel = ({
  open,
  source = "",
  onCancel,
  onConfirm,
  labels,
  isProcessing = false,
}: AvatarEditorModalInput) => {
  const controller = useAvatarEditorController({
    open,
    source,
    onConfirm,
    labels,
    isProcessing,
  });

  const {
    mergedLabels,
    imageTransform,
    imageRef,
    containerRef,
    isZoomInDisabled,
    isZoomOutDisabled,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handleZoomIn,
    handleZoomOut,
    handleConfirm,
    handleImageLoad,
  } = controller;

  return {
    isOpen: open,
    viewProps: {
      labels: mergedLabels,
      viewport: {
        containerRef,
        imageRef,
        source,
        imageTransform,
        pointerHandlers: {
          onPointerDown: handlePointerDown,
          onPointerMove: handlePointerMove,
          onPointerUp: handlePointerUp,
        },
        onImageLoad: handleImageLoad,
      },
      controls: {
        zoom: {
          onZoomIn: handleZoomIn,
          onZoomOut: handleZoomOut,
          isZoomInDisabled,
          isZoomOutDisabled,
        },
        actions: {
          onCancel,
          onConfirm: handleConfirm,
          isProcessing,
        },
      },
    },
  };
};

export default useAvatarEditorModalModel;
