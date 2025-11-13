import { clampNumber } from "./clamp.js";

/**
 * 意图：计算图片在视窗内允许的最大平移量，避免露出空白区域。
 * 输入：图片显示宽高与视窗边长。
 * 输出：返回横纵方向的最大位移绝对值。
 * 流程：
 *  1) 计算图片与视窗尺寸差；
 *  2) 若图片尺寸不大于视窗，则位移限制为 0；
 *  3) 否则为差值的一半。
 * 错误处理：参数非法时返回 0 限制。
 * 复杂度：O(1)。
 */
export function computeOffsetBounds(displayWidth, displayHeight, viewportSize) {
  if (displayWidth <= 0 || displayHeight <= 0 || viewportSize <= 0) {
    return { maxX: 0, maxY: 0 };
  }
  const maxX = Math.max(0, (displayWidth - viewportSize) / 2);
  const maxY = Math.max(0, (displayHeight - viewportSize) / 2);
  return { maxX, maxY };
}

/**
 * 意图：将平移向量限制在可视边界内。
 * 输入：待限制的偏移量与边界对象。
 * 输出：返回裁剪后的偏移。
 * 流程：
 *  1) 分别对 X/Y 轴应用 clamp；
 *  2) 返回新对象，确保引用透明性。
 * 错误处理：无异常抛出，统一回落至边界值。
 * 复杂度：O(1)。
 */
export function clampOffset({ x, y }, { maxX, maxY }) {
  const safeX = clampNumber(x ?? 0, -maxX, maxX);
  const safeY = clampNumber(y ?? 0, -maxY, maxY);
  return { x: safeX, y: safeY };
}
