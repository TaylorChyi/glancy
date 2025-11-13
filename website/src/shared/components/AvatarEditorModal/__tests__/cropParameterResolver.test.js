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
import {
  buildMatrix,
  createResolverArgs,
  expectRectCloseTo,
  geometryRectFor,
  mockComputedTransform,
  toMatrixString,
} from "./helpers/cropParameters.js";

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

describe("resolveCropParameters CSS calibration", () => {
  const viewportSize = 320;
  const naturalSize = { width: 1200, height: 800 };
  const displayMetrics = { scaleFactor: 0.48 };
  const offset = { x: -80, y: 0 };

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("Given deviant matrix When resolveCropParameters Then prefers CSS matrix with warning", () => {
    const matrix = { a: 2, b: 0, c: 0, d: 2, e: 0, f: 0 };
    const getComputedStyleSpy = mockComputedTransform(toMatrixString(matrix));
    const consoleSpy = jest.spyOn(console, "warn").mockImplementation(() => {});

    const result = resolveCropParameters(
      createResolverArgs({ displayMetrics, viewportSize, naturalSize, offset }),
    );

    getComputedStyleSpy.mockRestore();

    const expectedMatrixRect = computeCropRectFromMatrix({
      matrix,
      viewportSize,
      naturalWidth: naturalSize.width,
      naturalHeight: naturalSize.height,
    });
    const geometryRect = geometryRectFor({
      naturalSize,
      viewportSize,
      displayMetrics,
      offset,
    });

    expect(result?.strategy).toBe(CSS_MATRIX_STRATEGY_ID);
    expectRectCloseTo(result?.cropRect, expectedMatrixRect);
    expect(Math.abs(result.cropRect.x - geometryRect.x)).toBeGreaterThan(0.5);
    expect(consoleSpy).toHaveBeenCalledTimes(1);
    consoleSpy.mockRestore();
  });

  it("Given missing CSS matrix When resolveCropParameters Then falls back to geometry result", () => {
    mockComputedTransform("none");

    const result = resolveCropParameters(
      createResolverArgs({ displayMetrics, viewportSize, naturalSize, offset }),
    );

    const expected = geometryRectFor({
      naturalSize,
      viewportSize,
      displayMetrics,
      offset,
    });

    expect(result?.strategy).toBe(GEOMETRY_STRATEGY_ID);
    expectRectCloseTo(result?.cropRect, expected);
  });
});

describe("resolveCropParameters tolerance handling", () => {
  const viewportSize = 320;
  const naturalSize = { width: 1200, height: 800 };
  const displayMetrics = { scaleFactor: 0.48 };
  const offset = { x: -80, y: 0 };

  afterEach(() => {
    jest.restoreAllMocks();
  });

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
    const getComputedStyleSpy = mockComputedTransform(
      toMatrixString(adjustedMatrix),
    );
    const consoleSpy = jest.spyOn(console, "warn").mockImplementation(() => {});

    const result = resolveCropParameters(
      createResolverArgs({ displayMetrics, viewportSize, naturalSize, offset }),
    );

    getComputedStyleSpy.mockRestore();

    const geometryRect = geometryRectFor({
      naturalSize,
      viewportSize,
      displayMetrics,
      offset,
    });

    expect(result?.strategy).toBe(CSS_MATRIX_STRATEGY_ID);
    expectRectCloseTo(result?.cropRect, geometryRect);
    expect(consoleSpy).not.toHaveBeenCalled();
    consoleSpy.mockRestore();
  });
});
