/**
 * 测试目标：
 *  - 验证裁剪参数解析器在基于矩阵的求解路径下能返回与几何工具一致的结果；
 *  - 覆盖不同缩放与偏移组合，以及异常矩阵分支。
 */

import { computeCropSourceRect } from "@shared/utils/avatarCropBox.js";
import {
  computeCropRectFromMatrix,
  parseTransformMatrix,
} from "../hooks/cropParameterResolver.js";

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
