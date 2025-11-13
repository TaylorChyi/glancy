import useAvatarEditorController from "./hooks/useAvatarEditorController.js";

const buildViewportHandlers = ({
  handlePointerDown,
  handlePointerMove,
  handlePointerUp,
}) => ({
  onPointerDown: handlePointerDown,
  onPointerMove: handlePointerMove,
  onPointerUp: handlePointerUp,
});

const buildViewportProps = ({ controller, source }: {
  controller: ReturnType<typeof useAvatarEditorController>;
  source: string;
}) => ({
  containerRef: controller.containerRef,
  imageRef: controller.imageRef,
  source,
  imageTransform: controller.imageTransform,
  pointerHandlers: buildViewportHandlers({
    handlePointerDown: controller.handlePointerDown,
    handlePointerMove: controller.handlePointerMove,
    handlePointerUp: controller.handlePointerUp,
  }),
  onImageLoad: controller.handleImageLoad,
});

const buildZoomControls = ({
  handleZoomIn,
  handleZoomOut,
  isZoomInDisabled,
  isZoomOutDisabled,
}) => ({
  onZoomIn: handleZoomIn,
  onZoomOut: handleZoomOut,
  isZoomInDisabled,
  isZoomOutDisabled,
});

const buildActionControls = ({
  onCancel,
  onConfirm,
  isProcessing,
}) => ({
  onCancel,
  onConfirm,
  isProcessing,
});

const buildControlProps = ({
  controller,
  onCancel,
  isProcessing,
}: {
  controller: ReturnType<typeof useAvatarEditorController>;
  onCancel: () => void;
  isProcessing: boolean;
}) => ({
  zoom: buildZoomControls({
    handleZoomIn: controller.handleZoomIn,
    handleZoomOut: controller.handleZoomOut,
    isZoomInDisabled: controller.isZoomInDisabled,
    isZoomOutDisabled: controller.isZoomOutDisabled,
  }),
  actions: buildActionControls({
    onCancel,
    onConfirm: controller.handleConfirm,
    isProcessing,
  }),
});

const buildViewProps = ({
  controller,
  source,
  onCancel,
  isProcessing,
}: {
  controller: ReturnType<typeof useAvatarEditorController>;
  source: string;
  onCancel: () => void;
  isProcessing: boolean;
}) => ({
  labels: controller.mergedLabels,
  viewport: buildViewportProps({ controller, source }),
  controls: buildControlProps({ controller, onCancel, isProcessing }),
});

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

  return {
    isOpen: open,
    viewProps: buildViewProps({
      controller,
      source,
      onCancel,
      isProcessing,
    }),
  };
};

export default useAvatarEditorModalModel;
