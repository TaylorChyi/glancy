import { clampNumber } from "./clamp.js";
import { clampOffset, computeOffsetBounds } from "./bounds.js";
import { clampZoom, computeDisplayMetrics } from "./scaling.js";

const ZERO_OFFSET = { x: 0, y: 0 };
const ZERO_BOUNDS = { maxX: 0, maxY: 0 };

const resolveZoomLimits = (minZoom, maxZoom) => {
  const safeMin = minZoom > 0 && Number.isFinite(minZoom) ? minZoom : 1;
  const safeMax =
    Number.isFinite(maxZoom) && maxZoom >= safeMin ? maxZoom : safeMin;
  return { safeMin, safeMax };
};

const hasValidGeometry = ({ naturalWidth, naturalHeight, viewportSize }) =>
  naturalWidth > 0 && naturalHeight > 0 && viewportSize > 0;

const buildFallbackViewport = (zoom) => ({
  zoom,
  offset: { ...ZERO_OFFSET },
  bounds: { ...ZERO_BOUNDS },
});

/**
 * 意图：推导以图片中心对齐的视图状态，供头像裁剪视窗初始化与重置复用。
 */
export function deriveCenteredViewportState(params) {
  const {
    naturalWidth,
    naturalHeight,
    viewportSize,
    zoom = 1,
    minZoom = 1,
    maxZoom = 1,
  } = params;
  const { safeMin, safeMax } = resolveZoomLimits(minZoom, maxZoom);
  const safeZoom = clampZoom(zoom, safeMin, safeMax);

  if (!hasValidGeometry({ naturalWidth, naturalHeight, viewportSize })) {
    return buildFallbackViewport(safeZoom);
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
    offset: clampOffset(ZERO_OFFSET, bounds),
    bounds,
  };
}

const hasValidCropInputs = ({
  naturalWidth,
  naturalHeight,
  viewportSize,
  scaleFactor,
}) =>
  naturalWidth > 0 &&
  naturalHeight > 0 &&
  viewportSize > 0 &&
  scaleFactor > 0 &&
  Number.isFinite(scaleFactor);

const buildFallbackCrop = (naturalWidth, naturalHeight) => ({
  x: 0,
  y: 0,
  width: Math.max(0, naturalWidth),
  height: Math.max(0, naturalHeight),
});

/**
 * 意图：在当前视图状态下计算 Canvas 裁剪所需的源图像矩形。
 */
export function computeCropSourceRect(params) {
  const { naturalWidth, naturalHeight, viewportSize, scaleFactor, offset } = params;
  if (!hasValidCropInputs({ naturalWidth, naturalHeight, viewportSize, scaleFactor })) {
    return buildFallbackCrop(naturalWidth, naturalHeight);
  }

  const safeOffsetX = offset?.x ?? 0;
  const safeOffsetY = offset?.y ?? 0;
  const halfViewport = viewportSize / 2;
  const rawWidth = viewportSize / scaleFactor;
  const rawHeight = rawWidth;
  const rawX = naturalWidth / 2 + (-halfViewport - safeOffsetX) / scaleFactor;
  const rawY = naturalHeight / 2 + (-halfViewport - safeOffsetY) / scaleFactor;

  const maxX = Math.max(0, naturalWidth - rawWidth);
  const maxY = Math.max(0, naturalHeight - rawHeight);

  return {
    x: clampNumber(rawX, 0, maxX),
    y: clampNumber(rawY, 0, maxY),
    width: Math.min(rawWidth, naturalWidth),
    height: Math.min(rawHeight, naturalHeight),
  };
}
