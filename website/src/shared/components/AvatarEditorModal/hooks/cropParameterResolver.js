/**
 * 背景：
 *  - 裁剪参数推导在多处使用，需要独立出来以便复用与测试。
 * 目的：
 *  - 根据当前视口与缩放状态计算出有效的 cropRect 与图像引用。
 * 关键决策与取舍：
 *  - 若缺少必备条件（image、scaleFactor 或 viewport），立即返回 null；
 *  - 维持纯函数特性，方便在单元测试中直接调用。
 * 影响范围：
 *  - AvatarEditorModal 裁剪流程。
 * 演进与TODO：
 *  - 可在此扩展更复杂的裁剪策略（例如旋转、镜像）。
 */

import { computeCropSourceRect } from "@shared/utils/avatarCropBox.js";

const resolveCropParameters = ({
  imageRef,
  displayMetrics,
  viewportSize,
  naturalSize,
  offset,
}) => {
  const image = imageRef.current;
  if (!image || displayMetrics.scaleFactor <= 0 || viewportSize <= 0) {
    return null;
  }

  const cropRect = computeCropSourceRect({
    naturalWidth: naturalSize.width,
    naturalHeight: naturalSize.height,
    viewportSize,
    scaleFactor: displayMetrics.scaleFactor,
    offset,
  });

  if (cropRect.width <= 0 || cropRect.height <= 0) {
    return null;
  }

  return { image, cropRect };
};

export default resolveCropParameters;
