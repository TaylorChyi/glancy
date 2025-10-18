/**
 * 背景：
 *  - 缩放、偏移、视口尺寸等几何状态与 UI 展示耦合紧密，过往集中在组件中导致逻辑膨胀。
 * 目的：
 *  - 抽离出“视口模型”钩子，专注于数据状态与几何推导，供控制器与展示层复用。
 * 关键决策与取舍：
 *  - 采用“核心状态 + 衍生计算 + 生命周期”分层，保持单个函数体积可控；
 *  - 默认只暴露展示层所需的最小集合，便于未来扩展旋转等能力。
 * 影响范围：
 *  - AvatarEditorModal 控制器；
 * 演进与TODO：
 *  - 可在未来引入“旋转/镜像”策略时，于此模块统一扩展计算逻辑。
 */

import { useRef } from "react";
import useViewportCoreState from "./useViewportCoreState.js";
import useViewportDerivedState from "./useViewportDerivedState.js";
import useViewportLifecycle from "./useViewportLifecycle.js";

const useAvatarViewportModel = ({ open, source }) => {
  const imageRef = useRef(null);
  const containerRef = useRef(null);

  const {
    shouldRecenterRef,
    zoom,
    setZoom,
    offset,
    setOffset,
    naturalSize,
    setNaturalSize,
    viewportSize,
    setViewportSize,
    resetView,
    recenterViewport,
  } = useViewportCoreState();

  const { displayMetrics, bounds, applyOffsetDelta, imageTransform } =
    useViewportDerivedState({
      naturalSize,
      viewportSize,
      zoom,
      offset,
      setOffset,
    });

  useViewportLifecycle({
    open,
    source,
    resetView,
    setNaturalSize,
    shouldRecenterRef,
    recenterViewport,
    naturalSize,
    viewportSize,
    containerRef,
    setViewportSize,
  });

  return {
    imageRef,
    containerRef,
    shouldRecenterRef,
    zoom,
    setZoom,
    naturalSize,
    setNaturalSize,
    viewportSize,
    setViewportSize,
    displayMetrics,
    bounds,
    imageTransform,
    offset,
    resetView,
    recenterViewport,
    applyOffsetDelta,
  };
};

export default useAvatarViewportModel;
