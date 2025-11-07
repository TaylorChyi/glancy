import { computeCropSourceRect } from "@shared/utils/avatarCropBox.js";
import { isValidRect } from "./rectUtils.js";

export const GEOMETRY_STRATEGY_ID = "geometry";

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
    if (!image || viewportSize <= 0) {
      return null;
    }
    if (naturalWidth <= 0 || naturalHeight <= 0) {
      return null;
    }
    const scaleFactor = displayMetrics?.scaleFactor;
    if (!(scaleFactor > 0) || !Number.isFinite(scaleFactor)) {
      return null;
    }

    const cropRect = computeCropSourceRect({
      naturalWidth,
      naturalHeight,
      viewportSize,
      scaleFactor,
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
