import { computeCropSourceRect } from "@shared/utils/avatarCropBox.js";
import { isValidRect } from "./rectUtils.js";

export const GEOMETRY_STRATEGY_ID = "geometry";

const hasValidGeometryInputs = ({
  image,
  viewportSize,
  naturalWidth,
  naturalHeight,
}) => Boolean(image) && viewportSize > 0 && naturalWidth > 0 && naturalHeight > 0;

const extractScaleFactor = (displayMetrics) => {
  const scaleFactor = displayMetrics?.scaleFactor;
  return Number.isFinite(scaleFactor) && scaleFactor > 0 ? scaleFactor : null;
};

export const resolveGeometryCropRect = ({
  naturalWidth,
  naturalHeight,
  viewportSize,
  displayMetrics,
  offset,
}) => {
  const scaleFactor = extractScaleFactor(displayMetrics);
  if (!scaleFactor) {
    return null;
  }

  return computeCropSourceRect({
    naturalWidth,
    naturalHeight,
    viewportSize,
    scaleFactor,
    offset,
  });
};

const geometryStrategy = {
  id: GEOMETRY_STRATEGY_ID,
  execute: ({
    image,
    viewportSize,
    naturalWidth,
    naturalHeight,
    displayMetrics,
    offset,
  }) => {
    if (!hasValidGeometryInputs({ image, viewportSize, naturalWidth, naturalHeight })) {
      return null;
    }
    const cropRect = resolveGeometryCropRect({
      naturalWidth,
      naturalHeight,
      viewportSize,
      displayMetrics,
      offset,
    });

    if (!isValidRect(cropRect)) {
      return null;
    }

    return {
      strategy: GEOMETRY_STRATEGY_ID,
      image,
      cropRect,
    };
  },
};

export default geometryStrategy;
