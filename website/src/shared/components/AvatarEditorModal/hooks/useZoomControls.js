/**
 * 背景：
 *  - 缩放控制原耦合在控制器主函数中，导致函数行数超限且难以复用。
 * 目的：
 *  - 抽象为独立 hook，提供缩放按钮的禁用状态与处理函数。
 * 关键决策与取舍：
 *  - 维持纯计算与回调组合，避免与视图层产生耦合；
 *  - 保持 MIN/MAX/STEP 常量的集中来源，防止散落魔法数。
 * 影响范围：
 *  - AvatarEditorModal 控制器。
 * 演进与TODO：
 *  - 后续若接入键盘快捷键，可在此 hook 内扩展额外触发器。
 */

import { useCallback } from "react";
import { clampZoom } from "@shared/utils/avatarCropBox.js";
import { MAX_ZOOM, MIN_ZOOM, ZOOM_STEP } from "../constants.js";

const useZoomControls = ({ zoom, setZoom, isProcessing }) => {
  const handleZoomIn = useCallback(() => {
    setZoom((previous) => clampZoom(previous + ZOOM_STEP, MIN_ZOOM, MAX_ZOOM));
  }, [setZoom]);

  const handleZoomOut = useCallback(() => {
    setZoom((previous) => clampZoom(previous - ZOOM_STEP, MIN_ZOOM, MAX_ZOOM));
  }, [setZoom]);

  const isZoomInDisabled = zoom >= MAX_ZOOM || isProcessing;
  const isZoomOutDisabled = zoom <= MIN_ZOOM || isProcessing;

  return {
    handleZoomIn,
    handleZoomOut,
    isZoomInDisabled,
    isZoomOutDisabled,
  };
};

export default useZoomControls;
