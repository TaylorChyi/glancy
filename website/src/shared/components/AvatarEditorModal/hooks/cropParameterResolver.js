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
// 解释：策略模式中我们始终以几何推导为基线，
// 但为了在未来扩展矩阵/旋转等能力时能够复用校验逻辑，
// 仍保留一个亚像素级的容差用于诊断差异。
const MATRIX_TOLERANCE_PX = 0.5;

const STRATEGY = Object.freeze({
  GEOMETRY: "geometry",
  CSS_MATRIX: "css-matrix",
});

const isFiniteNumber = (value) => Number.isFinite(value);

const isValidRect = (rect) =>
  Boolean(
    rect &&
      isFiniteNumber(rect.x) &&
      isFiniteNumber(rect.y) &&
      isFiniteNumber(rect.width) &&
      isFiniteNumber(rect.height) &&
      rect.width > 0 &&
      rect.height > 0,
  );

const measureRectDeviation = (candidate, reference) => {
  if (!isValidRect(candidate) || !isValidRect(reference)) {
    return Infinity;
  }
  return Math.max(
    Math.abs(candidate.x - reference.x),
    Math.abs(candidate.y - reference.y),
    Math.abs(candidate.width - reference.width),
    Math.abs(candidate.height - reference.height),
  );
};

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

/**
 * 意图：使用纯几何推导策略确保与视口状态一一对应，
 * 解决缩放/拖拽后裁剪区域错位的问题。
 * 输入：视图上下文（图像节点、自然尺寸、视窗尺寸、缩放信息、偏移量）。
 * 输出：若推导成功，返回裁剪矩形；否则返回 null 交由后续策略处理。
 * 流程：
 *  1) 校验必需参数（图片引用、尺寸、缩放因子）；
 *  2) 调用 computeCropSourceRect 推导矩形；
 *  3) 若矩形有效则携带策略标识返回。
 * 错误处理：输入非法时返回 null，由调用方决定是否继续执行其它策略。
 * 复杂度：O(1)。
 */
const geometryStrategy = ({
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
  const scaleFactor = displayMetrics.scaleFactor;
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
    strategy: STRATEGY.GEOMETRY,
    image,
    cropRect,
  };
};

/**
 * 意图：通过 CSS 矩阵逆解策略观测浏览器实际渲染结果，
 * 仅用于诊断几何推导与真实展示是否存在偏差。
 * 输入：图像节点与几何边界。
 * 输出：若矩阵可解析且数值有效，则返回对应矩形；否则返回 null。
 * 流程：
 *  1) 解析 transform matrix；
 *  2) 将视窗四角映射回原图坐标；
 *  3) 校验并返回结果。
 * 错误处理：解析失败或结果越界时返回 null，不中断流程。
 * 复杂度：O(1)。
 */
const cssMatrixStrategy = ({ image, viewportSize, naturalWidth, naturalHeight }) => {
  if (!image || viewportSize <= 0) {
    return null;
  }
  if (naturalWidth <= 0 || naturalHeight <= 0) {
    return null;
  }

  const cropRect = resolveCropRectUsingMatrix({
    image,
    viewportSize,
    naturalWidth,
    naturalHeight,
  });

  if (!isValidRect(cropRect)) {
    return null;
  }

  return {
    strategy: STRATEGY.CSS_MATRIX,
    image,
    cropRect,
  };
};

// 设计取舍：采用“策略链”模式确保几何解作为首选，
// 后续可按需追加旋转或镜像策略而无需改动调度器。
const STRATEGY_PIPELINE = [geometryStrategy, cssMatrixStrategy];

const resolveCropParameters = ({
  imageRef,
  displayMetrics,
  viewportSize,
  naturalSize,
  offset,
}) => {
  const context = {
    image: imageRef.current,
    viewportSize,
    naturalWidth: naturalSize.width,
    naturalHeight: naturalSize.height,
    displayMetrics,
    offset,
  };

  const evaluations = STRATEGY_PIPELINE.reduce((accumulator, strategy) => {
    const outcome = strategy(context);
    if (outcome) {
      accumulator.push(outcome);
    }
    return accumulator;
  }, []);

  const geometryResult = evaluations.find(
    (entry) => entry.strategy === STRATEGY.GEOMETRY,
  );
  if (!geometryResult) {
    return null;
  }

  const cssMatrixResult = evaluations.find(
    (entry) => entry.strategy === STRATEGY.CSS_MATRIX,
  );

  if (!cssMatrixResult) {
    return geometryResult;
  }

  const deviation = measureRectDeviation(
    cssMatrixResult.cropRect,
    geometryResult.cropRect,
  );

  if (
    deviation > MATRIX_TOLERANCE_PX &&
    typeof console !== "undefined" &&
    typeof console.warn === "function"
  ) {
    console.warn("avatar-editor-crop-mismatch", {
      deviation,
      viewportSize,
      naturalWidth: naturalSize.width,
      naturalHeight: naturalSize.height,
    });
  }

  return geometryResult;
};

export default resolveCropParameters;
