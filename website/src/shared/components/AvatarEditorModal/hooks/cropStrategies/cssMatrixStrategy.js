/**
 * 背景：
 *  - 仅依赖几何状态推导裁剪区域在部分环境下会受 CSS transform 细节影响，
 *    当缩放与拖拽叠加时容易出现导出与视图不一致的问题。
 * 目的：
 *  - 基于浏览器实际应用的 CSS 矩阵逆运算，直接从 DOM 渲染状态推导裁剪矩形，
 *    作为裁剪策略链中的第一优先级以保证视觉与导出一致。
 * 关键决策与取舍：
 *  - 通过解析 matrix/matrix3d 字符串获取仿射矩阵，保持对不同浏览器实现的兼容；
 *  - 在数值可疑时返回 null，由策略管线回退到几何解，避免误判；
 *  - 局部封装 clamp 工具，减少跨模块依赖。
 * 影响范围：
 *  - AvatarEditorModal 裁剪参数解析；
 * 演进与TODO：
 *  - 后续若支持旋转，可在此扩展 Z 轴矩阵求解路径。
 */

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
  const determinant = matrix.a * matrix.d - matrix.b * matrix.c;
  if (!Number.isFinite(determinant) || Math.abs(determinant) < SAFE_DETERMINANT_THRESHOLD) {
    return null;
  }

  const transformPoint = (x, y) => {
    const translatedX = x - matrix.e;
    const translatedY = y - matrix.f;
    const naturalX = (matrix.d * translatedX - matrix.c * translatedY) / determinant;
    const naturalY = (-matrix.b * translatedX + matrix.a * translatedY) / determinant;
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

const resolveCropRectUsingMatrix = ({ image, viewportSize, naturalWidth, naturalHeight }) => {
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

const cssMatrixStrategy = {
  id: CSS_MATRIX_STRATEGY_ID,
  execute: ({ image, viewportSize, naturalWidth, naturalHeight }) => {
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
      strategy: CSS_MATRIX_STRATEGY_ID,
      image,
      cropRect,
    };
  },
};

export default cssMatrixStrategy;
