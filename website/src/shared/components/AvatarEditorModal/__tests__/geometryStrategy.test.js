import { computeCropSourceRect } from "@shared/utils/avatarCropBox.js";
import {
  deriveGeometryCropRect,
  resolveGeometryCropRect,
  validateGeometryInputs,
} from "../hooks/cropStrategies/geometryStrategy.js";
import { appendImage, expectRectCloseTo } from "../testUtils/cropTestUtils.js";

describe("geometryStrategy helpers", () => {
  it("Given valid metrics When resolveGeometryCropRect Then matches computeCropSourceRect", () => {
    const params = {
      naturalWidth: 600,
      naturalHeight: 400,
      viewportSize: 200,
      displayMetrics: { scaleFactor: 0.5 },
      offset: { x: 20, y: -10 },
    };

    const expected = computeCropSourceRect({
      naturalWidth: params.naturalWidth,
      naturalHeight: params.naturalHeight,
      viewportSize: params.viewportSize,
      scaleFactor: params.displayMetrics.scaleFactor,
      offset: params.offset,
    });

    expect(resolveGeometryCropRect(params)).toEqual(expected);
  });

  it("Given invalid scale factor When resolveGeometryCropRect Then returns null", () => {
    expect(
      resolveGeometryCropRect({
        naturalWidth: 100,
        naturalHeight: 100,
        viewportSize: 50,
        displayMetrics: { scaleFactor: 0 },
        offset: { x: 0, y: 0 },
      }),
    ).toBeNull();
  });

  it("Given invalid geometry inputs When validateGeometryInputs Then returns false", () => {
    expect(
      validateGeometryInputs({
        image: null,
        viewportSize: 100,
        naturalWidth: 100,
        naturalHeight: 100,
      }),
    ).toBe(false);
  });

  it("Given valid inputs When deriveGeometryCropRect Then returns normalized rectangle", () => {
    const { image, cleanup } = appendImage();
    const params = {
      image,
      naturalWidth: 500,
      naturalHeight: 500,
      viewportSize: 200,
      displayMetrics: { scaleFactor: 0.4 },
      offset: { x: 10, y: -5 },
    };

    const rect = deriveGeometryCropRect(params);
    const expected = resolveGeometryCropRect(params);

    expectRectCloseTo(rect, expected);
    cleanup();
  });
});
