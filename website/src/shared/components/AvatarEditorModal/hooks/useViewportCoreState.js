/**
 * 背景：
 *  - useAvatarViewportModel 原本同时承担状态初始化与副作用调度，文件体积超标。
 * 目的：
 *  - 将视口核心状态管理抽离为独立 hook，确保主 hook 聚焦装配与组合。
 * 关键决策与取舍：
 *  - 暴露 reset/recenter 行为供上层组合，而非在组件中硬编码；
 *  - 保持纯钩子实现，便于单测时直接渲染并断言初始状态。
 * 影响范围：
 *  - AvatarEditorModal 视口状态管理；
 * 演进与TODO：
 *  - 若未来支持旋转/镜像，可在此扩展额外状态字段并保持接口稳定。
 */

import { useCallback, useRef, useState } from "react";
import { deriveCenteredViewportState } from "@shared/utils/avatarCropBox.js";
import { DEFAULT_VIEWPORT_SIZE, MAX_ZOOM, MIN_ZOOM } from "../constants.js";

const INITIAL_POINT = { x: 0, y: 0 };

const useViewportCoreState = () => {
  const shouldRecenterRef = useRef(true);
  const [zoom, setZoom] = useState(MIN_ZOOM);
  const [offset, setOffset] = useState(INITIAL_POINT);
  const [naturalSize, setNaturalSize] = useState({ width: 0, height: 0 });
  const [viewportSize, setViewportSize] = useState(DEFAULT_VIEWPORT_SIZE);

  const resetView = useCallback(() => {
    shouldRecenterRef.current = true;
    setZoom(MIN_ZOOM);
    setOffset(INITIAL_POINT);
  }, []);

  const recenterViewport = useCallback(
    ({
      naturalWidth,
      naturalHeight,
      viewport = viewportSize,
      zoom: targetZoom = MIN_ZOOM,
    }) => {
      const safeViewport = viewport > 0 ? viewport : viewportSize;
      if (naturalWidth <= 0 || naturalHeight <= 0 || safeViewport <= 0) {
        return false;
      }
      const nextState = deriveCenteredViewportState({
        naturalWidth,
        naturalHeight,
        viewportSize: safeViewport,
        zoom: targetZoom,
        minZoom: MIN_ZOOM,
        maxZoom: MAX_ZOOM,
      });
      setZoom(nextState.zoom);
      setOffset(nextState.offset);
      shouldRecenterRef.current = false;
      return true;
    },
    [viewportSize],
  );

  return {
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
  };
};

export default useViewportCoreState;
