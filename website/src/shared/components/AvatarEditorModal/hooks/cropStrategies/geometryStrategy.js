/**
 * 背景：
 *  - 几何推导依赖组件内部状态（缩放、偏移）即可计算裁剪矩形，是早期版本的核心算法。
 * 目的：
 *  - 在 CSS 矩阵不可用或数值失真的场景下提供稳定回退，保持导出功能可用。
 * 关键决策与取舍：
 *  - 继续复用 avatarCropBox 的纯函数以确保行为与视图模型一致；
 *  - 仅在输入完整时返回结果，避免部分状态导致错误裁剪。
 * 影响范围：
 *  - AvatarEditorModal 裁剪参数解析策略链。
 * 演进与TODO：
 *  - 当未来引入旋转/镜像能力时，可在调用参数中拓展额外自由度。
 */

import { computeCropSourceRect } from "@shared/utils/avatarCropBox.js";
import { isValidRect } from "./rectUtils.js";

export const GEOMETRY_STRATEGY_ID = "geometry";

const geometryStrategy = {
  id: GEOMETRY_STRATEGY_ID,
  execute: ({
    image,
    viewportSize,
    naturalWidth,
    naturalHeight,
    displayMetrics,
    offset,
  }) => {
    if (!image || viewportSize <= 0) {
      return null;
    }
    if (naturalWidth <= 0 || naturalHeight <= 0) {
      return null;
    }
    const scaleFactor = displayMetrics?.scaleFactor;
    if (!(scaleFactor > 0) || !Number.isFinite(scaleFactor)) {
      return null;
    }

    const cropRect = computeCropSourceRect({
      naturalWidth,
      naturalHeight,
      viewportSize,
      scaleFactor,
      offset,
    });

    if (!isValidRect(cropRect)) {
      return null;
    }

    return {
      strategy: GEOMETRY_STRATEGY_ID,
      image,
      cropRect,
    };
  },
};

export default geometryStrategy;
