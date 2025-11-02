/**
 * 背景：
 *  - 控制器内负责装配多个子 hook，代码冗长且难以阅读。
 * 目的：
 *  - 将依赖装配集中在专用 hook 中，保持主控制器函数精简。
 * 关键决策与取舍：
 *  - 组合视口模型、指针控制、图像加载、裁剪导出与缩放控制；
 *  - 输出统一的依赖包供控制器工厂函数消费。
 * 影响范围：
 *  - AvatarEditorModal 控制器实现。
 * 演进与TODO：
 *  - 若新增键盘或辅助功能交互，可在此扩展新的子 hook。
 */

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
