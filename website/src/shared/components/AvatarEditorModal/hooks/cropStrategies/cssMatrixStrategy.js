import { isValidRect } from "./rectUtils.js";

const SAFE_DETERMINANT_THRESHOLD = 1e-6;
export const CSS_MATRIX_STRATEGY_ID = "css-matrix";

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

const toNumericList = (raw) => raw.split(",").map((value) => Number(value.trim()));

const hasExpectedFiniteValues = (values, expectedLength) =>
  values.length === expectedLength && values.every((value) => Number.isFinite(value));

export const parseMatrixComponents = (normalized) => {
  if (normalized.startsWith("matrix3d(") && normalized.endsWith(")")) {
    const values = toNumericList(normalized.slice(9, -1));
    if (!hasExpectedFiniteValues(values, 16)) {
      return null;
    }
    const [m11, m12, , , m21, m22, , , , , , , m41, m42] = values;
    return { a: m11, b: m12, c: m21, d: m22, e: m41, f: m42 };
  }

  if (normalized.startsWith("matrix(") && normalized.endsWith(")")) {
    const values = toNumericList(normalized.slice(7, -1));
    if (!hasExpectedFiniteValues(values, 6)) {
      return null;
    }
    const [a, b, c, d, e, f] = values;
    return { a, b, c, d, e, f };
  }

  return null;
};

/**
 * 意图：解析浏览器返回的 transform 字符串，提取可逆的 2D 仿射矩阵。
 * 输入：transform - getComputedStyle 返回的 transform 字符串。
 * 输出：若格式符合 matrix/matrix3d，则返回 { a,b,c,d,e,f }；否则返回 null。
 * 流程：
 *  1) 处理 matrix3d，保留平面相关分量；
 *  2) 处理标准 matrix；
 *  3) 其它情况返回 null。
 */
export const parseTransformMatrix = (transform) => {
  if (!transform || transform === "none") {
    return null;
  }
  return parseMatrixComponents(transform.trim());
};

const computeDeterminant = (matrix) => matrix.a * matrix.d - matrix.b * matrix.c;

const isSafeDeterminant = (determinant) =>
  Number.isFinite(determinant) && Math.abs(determinant) >= SAFE_DETERMINANT_THRESHOLD;

const createInverseTransform = (matrix, determinant) => (corner) => {
  const translatedX = corner.x - matrix.e;
  const translatedY = corner.y - matrix.f;
  return {
    x: (matrix.d * translatedX - matrix.c * translatedY) / determinant,
    y: (-matrix.b * translatedX + matrix.a * translatedY) / determinant,
  };
};

const buildViewportCorners = (viewportSize) => [
  { x: 0, y: 0 },
  { x: viewportSize, y: 0 },
  { x: 0, y: viewportSize },
  { x: viewportSize, y: viewportSize },
];

const areFiniteCorners = (corners) =>
  corners.every((corner) => Number.isFinite(corner.x) && Number.isFinite(corner.y));

const clampCorners = ({ corners, naturalWidth, naturalHeight }) =>
  corners.map((corner) => ({
    x: clampWithin(corner.x, 0, naturalWidth),
    y: clampWithin(corner.y, 0, naturalHeight),
  }));

const buildBoundingRect = (corners) => {
  const xs = corners.map((corner) => corner.x);
  const ys = corners.map((corner) => corner.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  if (maxX <= minX || maxY <= minY) {
    return null;
  }
  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
};

const invertViewportCorners = ({ matrix, viewportSize }) => {
  const determinant = computeDeterminant(matrix);
  if (!isSafeDeterminant(determinant)) {
    return null;
  }
  const transformCorner = createInverseTransform(matrix, determinant);
  const corners = buildViewportCorners(viewportSize).map(transformCorner);
  return areFiniteCorners(corners) ? corners : null;
};

/**
 * 意图：依据 transform 矩阵将视窗四角逆映射回原图坐标，获得裁剪矩形。
 * 输入：matrix - 仿射矩阵；viewportSize - 视窗边长；naturalWidth/naturalHeight - 原图尺寸。
 * 输出：若运算有效返回矩形对象，否则返回 null。
 * 流程：
 *  1) 计算矩阵行列式并检查可逆性；
 *  2) 将视窗四角通过矩阵逆映射到原图坐标；
 *  3) 钳制结果避免超出原图范围。
 */
export const computeCropRectFromMatrix = ({
  matrix,
  viewportSize,
  naturalWidth,
  naturalHeight,
}) => {
  const corners = invertViewportCorners({ matrix, viewportSize });
  if (!corners) {
    return null;
  }

  const clampedCorners = clampCorners({
    corners,
    naturalWidth,
    naturalHeight,
  });
  return buildBoundingRect(clampedCorners);
};

export const clampCornersWithinImage = clampCorners;

const hasValidMatrixInputs = ({ image, viewportSize, naturalWidth, naturalHeight }) =>
  Boolean(image) && viewportSize > 0 && naturalWidth > 0 && naturalHeight > 0;

const readImageMatrix = (image) => {
  const view = image?.ownerDocument?.defaultView;
  if (!view) {
    return null;
  }
  return parseTransformMatrix(view.getComputedStyle(image).transform);
};

export const resolveCropRectUsingMatrix = ({
  image,
  viewportSize,
  naturalWidth,
  naturalHeight,
}) => {
  const matrix = readImageMatrix(image);
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

const cssMatrixStrategy = {
  id: CSS_MATRIX_STRATEGY_ID,
  execute: ({ image, viewportSize, naturalWidth, naturalHeight }) => {
    if (!hasValidMatrixInputs({
      image,
      viewportSize,
      naturalWidth,
      naturalHeight,
    })) {
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
      strategy: CSS_MATRIX_STRATEGY_ID,
      image,
      cropRect,
    };
  },
};

export default cssMatrixStrategy;
