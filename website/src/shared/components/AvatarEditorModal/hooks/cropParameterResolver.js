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

const SAFE_DETERMINANT_THRESHOLD = 1e-6;

const clampWithin = (value, min, max) => {
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

export const parseTransformMatrix = (transform) => {
  if (!transform || transform === "none") {
    return null;
  }

  const normalized = transform.trim();
  let components = [];

  if (normalized.startsWith("matrix3d(") && normalized.endsWith(")")) {
    components = normalized
      .slice(9, -1)
      .split(",")
      .map((value) => Number(value.trim()));
    if (components.length !== 16 || components.some((value) => !Number.isFinite(value))) {
      return null;
    }
    const [
      m11,
      m12,
      ,
      ,
      m21,
      m22,
      ,
      ,
      ,
      ,
      ,
      ,
      m41,
      m42,
    ] = components;

    return {
      a: m11,
      b: m12,
      c: m21,
      d: m22,
      e: m41,
      f: m42,
    };
  }

  if (normalized.startsWith("matrix(") && normalized.endsWith(")")) {
    components = normalized
      .slice(7, -1)
      .split(",")
      .map((value) => Number(value.trim()));
    if (components.length !== 6 || components.some((value) => !Number.isFinite(value))) {
      return null;
    }
    const [a, b, c, d, e, f] = components;
    return { a, b, c, d, e, f };
  }

  return null;
};

export const computeCropRectFromMatrix = ({
  matrix,
  viewportSize,
  naturalWidth,
  naturalHeight,
}) => {
  const determinant = matrix.a * matrix.d - matrix.b * matrix.c;
  if (!Number.isFinite(determinant) || Math.abs(determinant) < SAFE_DETERMINANT_THRESHOLD) {
    return null;
  }

  const transformPoint = (x, y) => {
    const translatedX = x - matrix.e;
    const translatedY = y - matrix.f;
    const naturalX =
      (matrix.d * translatedX - matrix.c * translatedY) / determinant;
    const naturalY =
      (-matrix.b * translatedX + matrix.a * translatedY) / determinant;
    return { x: naturalX, y: naturalY };
  };

  const corners = [
    transformPoint(0, 0),
    transformPoint(viewportSize, 0),
    transformPoint(0, viewportSize),
    transformPoint(viewportSize, viewportSize),
  ];

  if (corners.some((point) => !Number.isFinite(point.x) || !Number.isFinite(point.y))) {
    return null;
  }

  const xs = corners.map((point) => point.x);
  const ys = corners.map((point) => point.y);

  let minX = Math.min(...xs);
  let maxX = Math.max(...xs);
  let minY = Math.min(...ys);
  let maxY = Math.max(...ys);

  minX = clampWithin(minX, 0, naturalWidth);
  maxX = clampWithin(maxX, 0, naturalWidth);
  minY = clampWithin(minY, 0, naturalHeight);
  maxY = clampWithin(maxY, 0, naturalHeight);

  if (maxX <= minX || maxY <= minY) {
    return null;
  }

  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
  };
};

export const resolveCropRectUsingMatrix = ({
  image,
  viewportSize,
  naturalWidth,
  naturalHeight,
}) => {
  const view = image?.ownerDocument?.defaultView;
  if (!view || viewportSize <= 0) {
    return null;
  }

  const transform = view.getComputedStyle(image).transform;
  const matrix = parseTransformMatrix(transform);
  if (!matrix) {
    return null;
  }

  return computeCropRectFromMatrix({
    matrix,
    viewportSize,
    naturalWidth,
    naturalHeight,
  });
};

const resolveCropParameters = ({
  imageRef,
  displayMetrics,
  viewportSize,
  naturalSize,
  offset,
}) => {
  const image = imageRef.current;
  if (!image || viewportSize <= 0) {
    return null;
  }

  const naturalWidth = naturalSize.width;
  const naturalHeight = naturalSize.height;
  if (naturalWidth <= 0 || naturalHeight <= 0) {
    return null;
  }

  const matrixCropRect = resolveCropRectUsingMatrix({
    image,
    viewportSize,
    naturalWidth,
    naturalHeight,
  });
  if (matrixCropRect) {
    return { image, cropRect: matrixCropRect };
  }

  if (displayMetrics.scaleFactor <= 0) {
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
