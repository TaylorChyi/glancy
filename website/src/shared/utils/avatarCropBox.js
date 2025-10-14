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

/**
 * 意图：推导以图片中心对齐的视图状态，供头像裁剪视窗初始化与重置复用。
 * 输入：
 *  - naturalWidth/naturalHeight：原图尺寸；
 *  - viewportSize：正方形视窗边长；
 *  - zoom：期望的缩放倍数；
 *  - minZoom/maxZoom：允许的缩放上下限。
 * 输出：返回包含钳制后的缩放值、中心偏移量与平移边界的对象。
 * 流程：
 *  1) 钳制缩放倍数，确保后续展示不超出限制；
 *  2) 计算当前缩放下的展示宽高与平移边界；
 *  3) 将零偏移量钳制在边界内，得到以中心为原点的偏移。
 * 错误处理：
 *  - 尺寸或视窗非法时，返回零偏移与钳制后的缩放，交由调用方决定是否重试。
 * 复杂度：O(1)。
 */
export function deriveCenteredViewportState({
  naturalWidth,
  naturalHeight,
  viewportSize,
  zoom = 1,
  minZoom = 1,
  maxZoom = 1,
}) {
  const safeMinZoom = minZoom > 0 && Number.isFinite(minZoom) ? minZoom : 1;
  const safeMaxZoom =
    maxZoom >= safeMinZoom && Number.isFinite(maxZoom) ? maxZoom : safeMinZoom;
  const safeZoom = clampZoom(zoom, safeMinZoom, safeMaxZoom);

  if (naturalWidth <= 0 || naturalHeight <= 0 || viewportSize <= 0) {
    return {
      zoom: safeZoom,
      offset: { x: 0, y: 0 },
      bounds: { maxX: 0, maxY: 0 },
    };
  }

  const { width, height } = computeDisplayMetrics({
    naturalWidth,
    naturalHeight,
    viewportSize,
    zoom: safeZoom,
  });
  const bounds = computeOffsetBounds(width, height, viewportSize);

  return {
    zoom: safeZoom,
    offset: clampOffset({ x: 0, y: 0 }, bounds),
    bounds,
  };
}

/**
 * 意图：在当前视图状态下计算 Canvas 裁剪所需的源图像矩形。
 * 输入：
 *  - naturalWidth/naturalHeight：原图尺寸；
 *  - viewportSize：视窗的实际 CSS 像素边长；
 *  - scaleFactor：展示时的综合缩放倍数（coverScale * zoom）；
 *  - offset：展示层记录的平移向量，单位为 CSS 像素。
 * 输出：返回 drawImage 所需的 x/y/width/height。
 * 流程：
 *  1) 先基于缩放换算视窗对应的原图尺寸；
 *  2) 再利用平移向量反推出窗口左上角在原图中的坐标；
 *  3) 最后对结果做边界钳制，避免因浮点误差溢出。
 * 错误处理：若输入非法，退回全图范围并保持非负结果。
 * 复杂度：O(1)。
 */
export function computeCropSourceRect({
  naturalWidth,
  naturalHeight,
  viewportSize,
  scaleFactor,
  offset,
}) {
  if (
    naturalWidth <= 0 ||
    naturalHeight <= 0 ||
    viewportSize <= 0 ||
    scaleFactor <= 0 ||
    !Number.isFinite(scaleFactor)
  ) {
    return {
      x: 0,
      y: 0,
      width: Math.max(0, naturalWidth),
      height: Math.max(0, naturalHeight),
    };
  }

  const safeOffsetX = offset?.x ?? 0;
  const safeOffsetY = offset?.y ?? 0;
  const halfViewport = viewportSize / 2;
  const rawWidth = viewportSize / scaleFactor;
  const rawHeight = viewportSize / scaleFactor;
  const rawX = naturalWidth / 2 + (-halfViewport - safeOffsetX) / scaleFactor;
  const rawY = naturalHeight / 2 + (-halfViewport - safeOffsetY) / scaleFactor;

  const maxX = Math.max(0, naturalWidth - rawWidth);
  const maxY = Math.max(0, naturalHeight - rawHeight);

  const width = Math.min(rawWidth, naturalWidth);
  const height = Math.min(rawHeight, naturalHeight);

  return {
    x: clampNumber(rawX, 0, maxX),
    y: clampNumber(rawY, 0, maxY),
    width,
    height,
  };
}

export default {
  computeCoverScale,
  computeDisplayMetrics,
  computeOffsetBounds,
  clampOffset,
  clampZoom,
  computeCropSourceRect,
  deriveCenteredViewportState,
};
