import { jest } from "@jest/globals";

export const buildMatrix = ({
  scale,
  offsetX = 0,
  offsetY = 0,
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

export const appendImage = () => {
  const image = document.createElement("img");
  document.body.appendChild(image);
  return {
    image,
    cleanup: () => {
      if (image.parentNode) {
        image.parentNode.removeChild(image);
      }
    },
  };
};

export const mockComputedStyleWithMatrix = (matrix) => {
  const spy = jest.spyOn(window, "getComputedStyle").mockReturnValue({
    transform: toMatrixString(matrix),
  });
  return () => spy.mockRestore();
};

export const expectRectCloseTo = (actual, expected, precision = 3) => {
  expect(actual).not.toBeNull();
  expect(actual.x).toBeCloseTo(expected.x, precision);
  expect(actual.y).toBeCloseTo(expected.y, precision);
  expect(actual.width).toBeCloseTo(expected.width, precision);
  expect(actual.height).toBeCloseTo(expected.height, precision);
};

export const createImageRef = () => ({
  current: document.createElement("img"),
});
