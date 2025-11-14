import { computeCropSourceRect } from "@shared/utils/avatarCropBox.js";
import { isValidRect } from "./rectUtils.js";

export const GEOMETRY_STRATEGY_ID = "geometry";

export const validateGeometryInputs = ({
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

export const deriveGeometryCropRect = ({
  naturalWidth,
  naturalHeight,
  viewportSize,
  displayMetrics,
  offset,
}) => {
  const cropRect = resolveGeometryCropRect({
    naturalWidth,
    naturalHeight,
    viewportSize,
    displayMetrics,
    offset,
  });
  return isValidRect(cropRect) ? cropRect : null;
};

const buildGeometryStrategyResult = ({ image, cropRect }) => ({
  strategy: GEOMETRY_STRATEGY_ID,
  image,
  cropRect,
});

const geometryStrategy = {
  id: GEOMETRY_STRATEGY_ID,
  execute: (inputs) => {
    if (!validateGeometryInputs(inputs)) {
      return null;
    }

    const cropRect = deriveGeometryCropRect(inputs);
    return cropRect ? buildGeometryStrategyResult({ image: inputs.image, cropRect }) : null;
  },
};

export default geometryStrategy;
