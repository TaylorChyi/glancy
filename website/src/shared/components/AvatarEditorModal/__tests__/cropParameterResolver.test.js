/**
 * 测试目标：
 *  - 验证裁剪参数解析器在基于矩阵的求解路径下能返回与几何工具一致的结果；
 *  - 覆盖不同缩放与偏移组合，以及异常矩阵分支。
 */

import { jest } from "@jest/globals";
import { computeCropSourceRect } from "@shared/utils/avatarCropBox.js";
import resolveCropParameters from "../hooks/cropParameterResolver.js";
import {
  CSS_MATRIX_STRATEGY_ID,
  computeCropRectFromMatrix,
  parseTransformMatrix,
} from "../hooks/cropStrategies/cssMatrixStrategy.js";

import { GEOMETRY_STRATEGY_ID } from "../hooks/cropStrategies/geometryStrategy.js";

const buildMatrix = ({ scale, offsetX, offsetY, viewportSize, naturalWidth, naturalHeight }) => {
  const halfViewport = viewportSize / 2;
  const halfNaturalWidth = naturalWidth / 2;
  const halfNaturalHeight = naturalHeight / 2;

  return {
    a: scale,
    b: 0,
    c: 0,
    d: scale,
    e: offsetX + halfViewport - scale * halfNaturalWidth,
    f: offsetY + halfViewport - scale * halfNaturalHeight,
  };
};

const toMatrixString = ({ a, b, c, d, e, f }) => `matrix(${a}, ${b}, ${c}, ${d}, ${e}, ${f})`;

describe("cropParameterResolver matrix helpers", () => {
  it("Given CSS matrix string When parseTransformMatrix Then returns affine components", () => {
    expect(parseTransformMatrix("none")).toBeNull();
    expect(parseTransformMatrix("matrix(1, 0, 0, 1, 0, 0)")).toEqual({
      a: 1,
      b: 0,
      c: 0,
      d: 1,
      e: 0,
      f: 0,
    });
    expect(
      parseTransformMatrix(
        "matrix3d(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 20, -10, 0, 1)",
      ),
    ).toEqual({
      a: 1,
      b: 0,
      c: 0,
      d: 1,
      e: 20,
      f: -10,
    });
  });

  it("Given centered state When computeCropRectFromMatrix Then matches legacy geometry", () => {
    const viewportSize = 320;
    const natural = { width: 1000, height: 1000 };
    const scale = 0.32;
    const matrix = buildMatrix({
      scale,
      offsetX: 0,
      offsetY: 0,
      viewportSize,
      naturalWidth: natural.width,
      naturalHeight: natural.height,
    });

    const expected = computeCropSourceRect({
      naturalWidth: natural.width,
      naturalHeight: natural.height,
      viewportSize,
      scaleFactor: scale,
      offset: { x: 0, y: 0 },
    });

    const actual = computeCropRectFromMatrix({
      matrix,
      viewportSize,
      naturalWidth: natural.width,
      naturalHeight: natural.height,
    });

    expect(actual).not.toBeNull();
    expect(actual.x).toBeCloseTo(expected.x);
    expect(actual.y).toBeCloseTo(expected.y);
    expect(actual.width).toBeCloseTo(expected.width);
    expect(actual.height).toBeCloseTo(expected.height);
  });

  it("Given zoomed with offset When computeCropRectFromMatrix Then aligns with geometry helper", () => {
    const viewportSize = 320;
    const natural = { width: 800, height: 600 };
    const scale = 0.96;
    const offset = { x: 48, y: -24 };
    const matrix = buildMatrix({
      scale,
      offsetX: offset.x,
      offsetY: offset.y,
      viewportSize,
      naturalWidth: natural.width,
      naturalHeight: natural.height,
    });

    const expected = computeCropSourceRect({
      naturalWidth: natural.width,
      naturalHeight: natural.height,
      viewportSize,
      scaleFactor: scale,
      offset,
    });

    const actual = computeCropRectFromMatrix({
      matrix,
      viewportSize,
      naturalWidth: natural.width,
      naturalHeight: natural.height,
    });

    expect(actual).not.toBeNull();
    expect(actual.x).toBeCloseTo(expected.x);
    expect(actual.y).toBeCloseTo(expected.y);
    expect(actual.width).toBeCloseTo(expected.width);
    expect(actual.height).toBeCloseTo(expected.height);
  });

  it("Given singular matrix When computeCropRectFromMatrix Then returns null", () => {
    expect(
      computeCropRectFromMatrix({
        matrix: { a: 0, b: 0, c: 0, d: 0, e: 0, f: 0 },
        viewportSize: 320,
        naturalWidth: 500,
        naturalHeight: 500,
      }),
    ).toBeNull();
  });
});

describe("resolveCropParameters calibration", () => {
  const viewportSize = 320;
  const naturalSize = { width: 1200, height: 800 };
  const displayMetrics = { scaleFactor: 0.48 };
  const offset = { x: -80, y: 0 };

  afterEach(() => {
    jest.restoreAllMocks();
  });

  /**
   * 测试目标：当 CSS 矩阵返回异常偏移时，应回退至纯几何计算并输出诊断日志。
   * 前置条件：构造 transform 矩阵使得解析结果与几何算法差异较大。
   * 步骤：
   *  1) mock getComputedStyle 返回偏离实际状态的矩阵；
   *  2) mock console.warn 捕获诊断；
   *  3) 调用 resolveCropParameters；
   * 断言：
   *  - 返回的 cropRect 与 computeCropSourceRect 一致；
   *  - console.warn 被调用一次。
   * 边界/异常：
   *  - 覆盖矩阵不可用路径。
   */
  it("Given deviant matrix When resolveCropParameters Then prefers CSS matrix with warning", () => {
    const matrix = { a: 2, b: 0, c: 0, d: 2, e: 0, f: 0 };
    const getComputedStyleSpy = jest
      .spyOn(window, "getComputedStyle")
      .mockReturnValue({ transform: toMatrixString(matrix) });
    const consoleSpy = jest
      .spyOn(console, "warn")
      .mockImplementation(() => {});

    const result = resolveCropParameters({
      imageRef: { current: document.createElement("img") },
      displayMetrics,
      viewportSize,
      naturalSize,
      offset,
    });

    getComputedStyleSpy.mockRestore();

    const expectedMatrixRect = computeCropRectFromMatrix({
      matrix,
      viewportSize,
      naturalWidth: naturalSize.width,
      naturalHeight: naturalSize.height,
    });
    const geometryRect = computeCropSourceRect({
      naturalWidth: naturalSize.width,
      naturalHeight: naturalSize.height,
      viewportSize,
      scaleFactor: displayMetrics.scaleFactor,
      offset,
    });

    expect(result?.strategy).toBe(CSS_MATRIX_STRATEGY_ID);
    expect(result?.cropRect).toBeDefined();
    expect(result?.cropRect.x).toBeCloseTo(expectedMatrixRect.x, 3);
    expect(result?.cropRect.y).toBeCloseTo(expectedMatrixRect.y, 3);
    expect(result?.cropRect.width).toBeCloseTo(expectedMatrixRect.width, 3);
    expect(result?.cropRect.height).toBeCloseTo(expectedMatrixRect.height, 3);
    expect(Math.abs(result.cropRect.x - geometryRect.x)).toBeGreaterThan(0.5);
    expect(consoleSpy).toHaveBeenCalledTimes(1);
    consoleSpy.mockRestore();
  });

  /**
   * 测试目标：当浏览器未提供 transform 矩阵时，应回退至几何策略，保证导出与视图状态一致。
   * 前置条件：mock getComputedStyle 返回 transform="none"，确保 CSS 策略失效。
   * 步骤：
   *  1) 调用 resolveCropParameters 推导结果；
   * 断言：
   *  - 返回策略为 geometry；
   *  - 裁剪矩形与几何工具计算结果相符。
   * 边界/异常：
   *  - 覆盖矩阵缺失的回退分支。
   */
  it("Given missing CSS matrix When resolveCropParameters Then falls back to geometry result", () => {
    jest
      .spyOn(window, "getComputedStyle")
      .mockReturnValue({ transform: "none" });

    const result = resolveCropParameters({
      imageRef: { current: document.createElement("img") },
      displayMetrics,
      viewportSize,
      naturalSize,
      offset,
    });

    const expected = computeCropSourceRect({
      naturalWidth: naturalSize.width,
      naturalHeight: naturalSize.height,
      viewportSize,
      scaleFactor: displayMetrics.scaleFactor,
      offset,
    });

    expect(result?.strategy).toBe(GEOMETRY_STRATEGY_ID);
    expect(result?.cropRect?.x).toBeCloseTo(expected.x, 3);
    expect(result?.cropRect?.y).toBeCloseTo(expected.y, 3);
    expect(result?.cropRect?.width).toBeCloseTo(expected.width, 3);
    expect(result?.cropRect?.height).toBeCloseTo(expected.height, 3);
  });

  /**
   * 测试目标：当矩阵与几何结果仅存在微小差异时，应返回 CSS 策略产物且不输出告警。
   * 前置条件：构造 transform 矩阵在容差范围内偏移。
   * 步骤：
   *  1) 生成接近实际状态的矩阵并 mock getComputedStyle；
   *  2) mock console.warn；
   *  3) 调用 resolveCropParameters；
   * 断言：
   *  - 返回策略标识为 CSS；
   *  - 裁剪矩形与几何推导近似一致；
   *  - console.warn 未被调用。
   * 边界/异常：
   *  - 覆盖容差判断逻辑。
   */
  it("Given near-perfect matrix When resolveCropParameters Then returns CSS result without warning", () => {
    const matrix = buildMatrix({
      scale: displayMetrics.scaleFactor,
      offsetX: offset.x,
      offsetY: offset.y,
      viewportSize,
      naturalWidth: naturalSize.width,
      naturalHeight: naturalSize.height,
    });
    const adjustedMatrix = { ...matrix, e: matrix.e + 0.0002 };
    const getComputedStyleSpy = jest
      .spyOn(window, "getComputedStyle")
      .mockReturnValue({ transform: toMatrixString(adjustedMatrix) });
    const consoleSpy = jest
      .spyOn(console, "warn")
      .mockImplementation(() => {});

    const result = resolveCropParameters({
      imageRef: { current: document.createElement("img") },
      displayMetrics,
      viewportSize,
      naturalSize,
      offset,
    });

    getComputedStyleSpy.mockRestore();

    const geometryRect = computeCropSourceRect({
      naturalWidth: naturalSize.width,
      naturalHeight: naturalSize.height,
      viewportSize,
      scaleFactor: displayMetrics.scaleFactor,
      offset,
    });

    expect(result?.strategy).toBe(CSS_MATRIX_STRATEGY_ID);
    expect(result?.cropRect).toBeDefined();
    expect(result?.cropRect.x).toBeCloseTo(geometryRect.x, 3);
    expect(result?.cropRect.y).toBeCloseTo(geometryRect.y, 3);
    expect(result?.cropRect.width).toBeCloseTo(geometryRect.width, 3);
    expect(result?.cropRect.height).toBeCloseTo(geometryRect.height, 3);
    expect(consoleSpy).not.toHaveBeenCalled();
    consoleSpy.mockRestore();
  });
});
