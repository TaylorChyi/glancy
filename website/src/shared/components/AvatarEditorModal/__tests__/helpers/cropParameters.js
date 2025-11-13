import { jest } from "@jest/globals";
import { computeCropSourceRect } from "@shared/utils/avatarCropBox.js";

export const buildMatrix = ({
  scale,
  offsetX,
  offsetY,
  viewportSize,
  naturalWidth,
  naturalHeight,
}) => {
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

export const toMatrixString = ({ a, b, c, d, e, f }) =>
  `matrix(${a}, ${b}, ${c}, ${d}, ${e}, ${f})`;

export const mockComputedTransform = (transformValue) =>
  jest.spyOn(window, "getComputedStyle").mockReturnValue({ transform: transformValue });

export const geometryRectFor = ({
  naturalSize,
  viewportSize,
  displayMetrics,
  offset,
}) =>
  computeCropSourceRect({
    naturalWidth: naturalSize.width,
    naturalHeight: naturalSize.height,
    viewportSize,
    scaleFactor: displayMetrics.scaleFactor,
    offset,
  });

export const expectRectCloseTo = (actual, expected, precision = 3) => {
  expect(actual).toBeDefined();
  expect(actual.x).toBeCloseTo(expected.x, precision);
  expect(actual.y).toBeCloseTo(expected.y, precision);
  expect(actual.width).toBeCloseTo(expected.width, precision);
  expect(actual.height).toBeCloseTo(expected.height, precision);
};

export const createResolverArgs = ({ displayMetrics, viewportSize, naturalSize, offset }) => ({
  imageRef: { current: document.createElement("img") },
  displayMetrics,
  viewportSize,
  naturalSize,
  offset,
});
