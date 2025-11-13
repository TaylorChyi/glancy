import { clampNumber } from "./clamp.js";

const DEFAULT_DISPLAY_METRICS = { scaleFactor: 1, width: 0, height: 0 };

const hasValidDisplayInputs = ({
  naturalWidth,
  naturalHeight,
  viewportSize,
  zoom,
}) =>
  naturalWidth > 0 &&
  naturalHeight > 0 &&
  viewportSize > 0 &&
  zoom > 0 &&
  Number.isFinite(zoom);

/**
 * 意图：计算图片在目标视窗内的最小覆盖缩放倍数。
 * 输入：图片原始宽高与正方形视窗边长。
 * 输出：返回确保图片能完全覆盖视窗的缩放倍数。
 * 流程：
 *  1) 计算分别沿宽高覆盖所需倍数；
 *  2) 取两者中的较大值；
 * 错误处理：若参数非法，则回退为 1。
 * 复杂度：O(1)。
 */
export function computeCoverScale(naturalWidth, naturalHeight, viewportSize) {
  if (naturalWidth <= 0 || naturalHeight <= 0 || viewportSize <= 0) {
    return 1;
  }
  const widthScale = viewportSize / naturalWidth;
  const heightScale = viewportSize / naturalHeight;
  return Math.max(widthScale, heightScale);
}

/**
 * 意图：根据当前缩放计算图片在屏幕上的尺寸数据。
 * 输入：原始宽高、视窗边长以及额外缩放系数。
 * 输出：返回图片在屏幕上的宽高与总缩放因子。
 * 流程：
 *  1) 使用 computeCoverScale 得到基础倍数；
 *  2) 将额外缩放因子叠加得到实际倍数与尺寸。
 * 错误处理：参数非法时返回零尺寸并保持安全默认。
 * 复杂度：O(1)。
 */
export function computeDisplayMetrics(params) {
  const { naturalWidth, naturalHeight, viewportSize, zoom = 1 } = params;
  if (!hasValidDisplayInputs({ naturalWidth, naturalHeight, viewportSize, zoom })) {
    return { ...DEFAULT_DISPLAY_METRICS };
  }

  const scaleFactor =
    computeCoverScale(naturalWidth, naturalHeight, viewportSize) * zoom;
  return {
    scaleFactor,
    width: naturalWidth * scaleFactor,
    height: naturalHeight * scaleFactor,
  };
}

export function clampZoom(value, min, max) {
  return clampNumber(value, min, max);
}
