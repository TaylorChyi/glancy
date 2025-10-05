/**
 * 背景：
 *  - 头像裁剪交互此前缺少几何计算抽象，导致计算逻辑分散在组件内且难以测试。
 * 目的：
 *  - 提供纯函数工具，负责计算覆盖缩放、偏移边界及约束，便于在不同 UI 中复用。
 * 关键决策与取舍：
 *  - 采用策略化的几何计算：通过独立纯函数暴露裁剪策略，组件仅负责状态管理；
 *    若直接在组件内写死计算，将形成一次性补丁，后续难以扩展旋转等能力；
 *  - 拒绝引入第三方裁剪库，控制体积并保留演进空间。
 * 影响范围：
 *  - 当前由头像裁剪模态调用；后续若有移动端或批量裁剪，可直接复用同一工具。
 * 演进与TODO：
 *  - TODO: 后续支持旋转或非正方形裁剪时，应在此扩展对应策略函数。
 */

const clampNumber = (value, min, max) => {
  if (!Number.isFinite(value)) {
    return min;
  }
  if (value < min) {
    return min;
  }
  if (value > max) {
    return max;
  }
  return value;
};

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
export function computeDisplayMetrics({
  naturalWidth,
  naturalHeight,
  viewportSize,
  zoom = 1,
}) {
  if (
    naturalWidth <= 0 ||
    naturalHeight <= 0 ||
    viewportSize <= 0 ||
    zoom <= 0 ||
    !Number.isFinite(zoom)
  ) {
    return {
      scaleFactor: 1,
      width: 0,
      height: 0,
    };
  }

  const coverScale = computeCoverScale(
    naturalWidth,
    naturalHeight,
    viewportSize,
  );
  const scaleFactor = coverScale * zoom;
  return {
    scaleFactor,
    width: naturalWidth * scaleFactor,
    height: naturalHeight * scaleFactor,
  };
}

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

export function clampZoom(value, min, max) {
  return clampNumber(value, min, max);
}

export default {
  computeCoverScale,
  computeDisplayMetrics,
  computeOffsetBounds,
  clampOffset,
  clampZoom,
};
