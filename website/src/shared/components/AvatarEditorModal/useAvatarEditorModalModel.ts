import useAvatarEditorController from "./hooks/useAvatarEditorController.js";

type AvatarEditorModalInput = {
  open: boolean;
  source?: string;
  onCancel: () => void;
  onConfirm: (data: unknown) => void;
  labels?: Record<string, string>;
  isProcessing?: boolean;
};

type AvatarEditorController = ReturnType<typeof useAvatarEditorController>;

type BuildViewportPropsInput = Pick<
  AvatarEditorController,
  | "mergedLabels"
  | "containerRef"
  | "imageRef"
  | "imageTransform"
  | "handlePointerDown"
  | "handlePointerMove"
  | "handlePointerUp"
  | "handleImageLoad"
> & {
  source: string;
};

export const buildViewportProps = ({
  mergedLabels,
  source,
  containerRef,
  imageRef,
  imageTransform,
  handlePointerDown,
  handlePointerMove,
  handlePointerUp,
  handleImageLoad,
}: BuildViewportPropsInput) => ({
  containerRef,
  imageRef,
  source,
  imageTransform,
  pointerHandlers: {
    onPointerDown: handlePointerDown,
    onPointerMove: handlePointerMove,
    onPointerUp: handlePointerUp,
  },
  interactionLabel: mergedLabels.title,
  onImageLoad: handleImageLoad,
});

type BuildControlsPropsInput = Pick<
  AvatarEditorController,
  | "handleConfirm"
  | "handleZoomIn"
  | "handleZoomOut"
  | "isZoomInDisabled"
  | "isZoomOutDisabled"
> & {
  onCancel: AvatarEditorModalInput["onCancel"];
  isProcessing: boolean;
};

export const buildControlsProps = ({
  onCancel,
  isProcessing,
  handleConfirm,
  handleZoomIn,
  handleZoomOut,
  isZoomInDisabled,
  isZoomOutDisabled,
}: BuildControlsPropsInput) => ({
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
});

type BuildViewPropsInput = {
  labels: AvatarEditorController["mergedLabels"];
  viewport: ReturnType<typeof buildViewportProps>;
  controls: ReturnType<typeof buildControlsProps>;
};

export const buildViewProps = ({
  labels,
  viewport,
  controls,
}: BuildViewPropsInput) => ({
  labels,
  viewport,
  controls,
});

type BuildModelInput = {
  controller: AvatarEditorController;
  open: boolean;
  source: string;
  onCancel: AvatarEditorModalInput["onCancel"];
  isProcessing: boolean;
};

const buildModalModel = ({
  controller,
  open,
  source,
  onCancel,
  isProcessing,
}: BuildModelInput) => {
  const viewport = buildViewportProps({
    mergedLabels: controller.mergedLabels,
    containerRef: controller.containerRef,
    imageRef: controller.imageRef,
    source,
    imageTransform: controller.imageTransform,
    handlePointerDown: controller.handlePointerDown,
    handlePointerMove: controller.handlePointerMove,
    handlePointerUp: controller.handlePointerUp,
    handleImageLoad: controller.handleImageLoad,
  });

  const controls = buildControlsProps({
    onCancel,
    isProcessing,
    handleConfirm: controller.handleConfirm,
    handleZoomIn: controller.handleZoomIn,
    handleZoomOut: controller.handleZoomOut,
    isZoomInDisabled: controller.isZoomInDisabled,
    isZoomOutDisabled: controller.isZoomOutDisabled,
  });

  return {
    isOpen: open,
    viewProps: buildViewProps({
      labels: controller.mergedLabels,
      viewport,
      controls,
    }),
  };
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

  return buildModalModel({
    controller,
    open,
    source,
    onCancel,
    isProcessing,
  });
};

export default useAvatarEditorModalModel;
