import useAvatarEditorController from "./hooks/useAvatarEditorController.js";

type AvatarEditorModalInput = {
  open: boolean;
  source?: string;
  onCancel: () => void;
  onConfirm: (data: unknown) => void;
  labels?: Record<string, string>;
  isProcessing?: boolean;
};

type ControllerState = ReturnType<typeof useAvatarEditorController>;

type BuildViewPropsInput = {
  controller: ControllerState;
  onCancel: () => void;
  isProcessing: boolean;
  source: string;
};

const buildPointerHandlers = (controller: ControllerState) => ({
  onPointerDown: controller.handlePointerDown,
  onPointerMove: controller.handlePointerMove,
  onPointerUp: controller.handlePointerUp,
});

const buildViewportProps = ({
  controller,
  source,
}: {
  controller: ControllerState;
  source: string;
}) => ({
  containerRef: controller.containerRef,
  imageRef: controller.imageRef,
  source,
  imageTransform: controller.imageTransform,
  interactions: {
    pointerHandlers: buildPointerHandlers(controller),
    label: controller.mergedLabels.title,
  },
  onImageLoad: controller.handleImageLoad,
});

const buildControlProps = ({
  controller,
  onCancel,
  isProcessing,
}: {
  controller: ControllerState;
  onCancel: () => void;
  isProcessing: boolean;
}) => ({
  zoom: {
    onZoomIn: controller.handleZoomIn,
    onZoomOut: controller.handleZoomOut,
    isZoomInDisabled: controller.isZoomInDisabled,
    isZoomOutDisabled: controller.isZoomOutDisabled,
  },
  actions: {
    onCancel,
    onConfirm: controller.handleConfirm,
    isProcessing,
  },
});

const buildViewProps = ({
  controller,
  onCancel,
  isProcessing,
  source,
}: BuildViewPropsInput) => ({
  labels: controller.mergedLabels,
  viewport: buildViewportProps({ controller, source }),
  controls: buildControlProps({ controller, onCancel, isProcessing }),
});

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
  const viewProps = buildViewProps({
    controller,
    onCancel,
    isProcessing,
    source,
  });

  return {
    isOpen: open,
    viewProps,
  };
};

export default useAvatarEditorModalModel;
