import { computeCropSourceRect } from "@shared/utils/avatarCropBox.js";
import {
  clampCornersWithinImage,
  computeCropRectFromMatrix,
  deriveCssMatrixCropRect,
  parseMatrixComponents,
  parseTransformMatrix,
  resolveCropRectUsingMatrix,
  validateCssMatrixInputs,
} from "../hooks/cropStrategies/cssMatrixStrategy.js";
import {
  appendImage,
  buildMatrix,
  expectRectCloseTo,
  mockComputedStyleWithMatrix,
} from "../testUtils/cropTestUtils.js";

it("Given normalized matrix string When parseMatrixComponents Then extracts affine values", () => {
  expect(parseMatrixComponents("matrix(1, 0, 0, 1, 5, -3)")).toEqual({
    a: 1,
    b: 0,
    c: 0,
    d: 1,
    e: 5,
    f: -3,
  });
  expect(
    parseMatrixComponents(
      "matrix3d(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 15, 12, 0, 1)",
    ),
  ).toEqual({ a: 1, b: 0, c: 0, d: 1, e: 15, f: 12 });
  expect(parseMatrixComponents("translate(10px, 20px)")).toBeNull();
});

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

it("Given centered state When computeCropRectFromMatrix Then matches geometry rect", () => {
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

  expectRectCloseTo(actual, expected);
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

  expectRectCloseTo(actual, expected);
});

it("Given oversized corners When clampCornersWithinImage Then clamps within bounds", () => {
  const corners = [
    { x: -50, y: -20 },
    { x: 900, y: -10 },
    { x: -30, y: 1200 },
    { x: 850, y: 1250 },
  ];
  const clamped = clampCornersWithinImage({
    corners,
    naturalWidth: 800,
    naturalHeight: 600,
  });

  clamped.forEach((corner) => {
    expect(corner.x).toBeGreaterThanOrEqual(0);
    expect(corner.x).toBeLessThanOrEqual(800);
    expect(corner.y).toBeGreaterThanOrEqual(0);
    expect(corner.y).toBeLessThanOrEqual(600);
  });
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

it("Given invalid inputs When validateCssMatrixInputs Then returns false", () => {
  expect(
    validateCssMatrixInputs({
      image: null,
      viewportSize: 100,
      naturalWidth: 200,
      naturalHeight: 200,
    }),
  ).toBe(false);

  expect(
    validateCssMatrixInputs({
      image: document.createElement("img"),
      viewportSize: -10,
      naturalWidth: 200,
      naturalHeight: 200,
    }),
  ).toBe(false);
});

it("Given valid DOM inputs When deriveCssMatrixCropRect mirrors computeCropRectFromMatrix", () => {
  const viewportSize = 220;
  const natural = { width: 640, height: 640 };
  const { image, cleanup } = appendImage();
  const matrix = buildMatrix({
    scale: 0.5,
    offsetX: 25,
    offsetY: -15,
    viewportSize,
    naturalWidth: natural.width,
    naturalHeight: natural.height,
  });

  const restore = mockComputedStyleWithMatrix(matrix);
  const rect = deriveCssMatrixCropRect({
    image,
    viewportSize,
    naturalWidth: natural.width,
    naturalHeight: natural.height,
  });
  const expected = computeCropRectFromMatrix({
    matrix,
    viewportSize,
    naturalWidth: natural.width,
    naturalHeight: natural.height,
  });

  expect(rect).toEqual(expected);
  restore();
  cleanup();
});

it("Given DOM image When resolveCropRectUsingMatrix Then returns computed rectangle", () => {
  const viewportSize = 200;
  const naturalWidth = 400;
  const naturalHeight = 400;
  const { image, cleanup } = appendImage();
  const matrix = buildMatrix({
    scale: 0.5,
    offsetX: 0,
    offsetY: 0,
    viewportSize,
    naturalWidth,
    naturalHeight,
  });
  const restore = mockComputedStyleWithMatrix(matrix);

  const result = resolveCropRectUsingMatrix({
    image,
    viewportSize,
    naturalWidth,
    naturalHeight,
  });

  const expected = computeCropRectFromMatrix({
    matrix,
    viewportSize,
    naturalWidth,
    naturalHeight,
  });

  expect(result).toEqual(expected);
  restore();
  cleanup();
});
