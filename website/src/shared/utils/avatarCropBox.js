import {
  clampZoom,
  computeCoverScale,
  computeDisplayMetrics,
} from "./avatarCropBox/scaling.js";
import { clampOffset, computeOffsetBounds } from "./avatarCropBox/bounds.js";
import {
  computeCropSourceRect,
  deriveCenteredViewportState,
} from "./avatarCropBox/viewport.js";

export { clampZoom, computeCoverScale, computeDisplayMetrics };
export { clampOffset, computeOffsetBounds };
export { computeCropSourceRect, deriveCenteredViewportState };

export default {
  computeCoverScale,
  computeDisplayMetrics,
  computeOffsetBounds,
  clampOffset,
  clampZoom,
  computeCropSourceRect,
  deriveCenteredViewportState,
};
