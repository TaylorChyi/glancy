/**
 * 背景：
 *  - 裁剪导出逻辑过去直接写在控制器中，Canvas 细节与状态判断混杂。
 * 目的：
 *  - 提供专责 hook，将参数推导与 Canvas 导出拆分，便于测试与复用。
 * 关键决策与取舍：
 *  - 依赖纯函数 resolveCropParameters 与 renderCroppedAvatar，减少副作用范围；
 *  - 缺少必要数据时提前返回，避免无意义的导出请求。
 * 影响范围：
 *  - AvatarEditorModal 控制器；
 * 演进与TODO：
 *  - 可在未来扩展更多导出格式或质量控制策略。
 */

import { useCallback } from "react";
import renderCroppedAvatar from "./avatarCropRenderer.js";
import resolveCropParameters from "./cropParameterResolver.js";

const useAvatarCropper = ({
  imageRef,
  displayMetrics,
  viewportSize,
  naturalSize,
  offset,
  onConfirm,
}) => {
  const buildCropParameters = useCallback(
    () =>
      resolveCropParameters({
        imageRef,
        displayMetrics,
        viewportSize,
        naturalSize,
        offset,
      }),
    [displayMetrics, imageRef, naturalSize, offset, viewportSize],
  );

  const handleConfirm = useCallback(async () => {
    try {
      const parameters = buildCropParameters();
      if (!parameters) {
        return;
      }
      const result = await renderCroppedAvatar(parameters);
      await onConfirm(result);
    } catch (error) {
      console.error(error);
    }
  }, [buildCropParameters, onConfirm]);

  return { handleConfirm };
};

export default useAvatarCropper;
