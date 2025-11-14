import { isValidRect } from "./rectUtils.js";

const SAFE_DETERMINANT_THRESHOLD = 1e-6;
const MATRIX_PREFIX = "matrix";
const MATRIX3D_PREFIX = "matrix3d";

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

const isMatrixOfType = (normalized, prefix) =>
  normalized.startsWith(`${prefix}(`) && normalized.endsWith(")");

const sliceMatrixValues = (normalized, prefix) =>
  normalized.slice(prefix.length + 1, -1);

const parseAffineMatrix2d = (normalized) => {
  if (!isMatrixOfType(normalized, MATRIX_PREFIX)) {
    return null;
  }
  const values = toNumericList(sliceMatrixValues(normalized, MATRIX_PREFIX));
  if (!hasExpectedFiniteValues(values, 6)) {
    return null;
  }
  const [a, b, c, d, e, f] = values;
  return { a, b, c, d, e, f };
};

const parseAffineMatrix3d = (normalized) => {
  if (!isMatrixOfType(normalized, MATRIX3D_PREFIX)) {
    return null;
  }
  const values = toNumericList(sliceMatrixValues(normalized, MATRIX3D_PREFIX));
  if (!hasExpectedFiniteValues(values, 16)) {
    return null;
  }
  const [m11, m12, , , m21, m22, , , , , , , m41, m42] = values;
  return { a: m11, b: m12, c: m21, d: m22, e: m41, f: m42 };
};

export const parseMatrixComponents = (normalized) =>
  parseAffineMatrix3d(normalized) ?? parseAffineMatrix2d(normalized);

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

const clampCornerWithinImage = ({ corner, naturalWidth, naturalHeight }) => ({
  x: clampWithin(corner.x, 0, naturalWidth),
  y: clampWithin(corner.y, 0, naturalHeight),
});

const clampCorners = ({ corners, naturalWidth, naturalHeight }) =>
  corners.map((corner) =>
    clampCornerWithinImage({ corner, naturalWidth, naturalHeight }),
  );

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

export const validateCssMatrixInputs = ({
  image,
  viewportSize,
  naturalWidth,
  naturalHeight,
}) => Boolean(image) && viewportSize > 0 && naturalWidth > 0 && naturalHeight > 0;

const readImageMatrix = (image) => {
  const view = image?.ownerDocument?.defaultView;
  if (!view) {
    return null;
  }
  return parseTransformMatrix(view.getComputedStyle(image).transform);
};

const buildMatrixCropParams = ({ matrix, viewportSize, naturalWidth, naturalHeight }) => ({
  matrix,
  viewportSize,
  naturalWidth,
  naturalHeight,
});

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

  return computeCropRectFromMatrix(
    buildMatrixCropParams({ matrix, viewportSize, naturalWidth, naturalHeight }),
  );
};

export const deriveCssMatrixCropRect = ({
  image,
  viewportSize,
  naturalWidth,
  naturalHeight,
}) => {
  const cropRect = resolveCropRectUsingMatrix({
    image,
    viewportSize,
    naturalWidth,
    naturalHeight,
  });
  return isValidRect(cropRect) ? cropRect : null;
};

const buildMatrixStrategyResult = ({ image, cropRect }) => ({
  strategy: CSS_MATRIX_STRATEGY_ID,
  image,
  cropRect,
});

const cssMatrixStrategy = {
  id: CSS_MATRIX_STRATEGY_ID,
  execute: (inputs) => {
    if (!validateCssMatrixInputs(inputs)) {
      return null;
    }

    const cropRect = deriveCssMatrixCropRect(inputs);
    return cropRect ? buildMatrixStrategyResult({ image: inputs.image, cropRect }) : null;
  },
};

export default cssMatrixStrategy;
