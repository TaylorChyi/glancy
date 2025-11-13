import {
  INFINITE_VIEWPORT,
  PLACEMENT_CONFIG,
  VIEWPORT_MARGIN,
} from "./constants.js";
import { alignPosition } from "./alignPosition.js";
import { clampToViewport } from "./clampToViewport.js";
import { computePreferredPlacements, resolvePlacement } from "./resolvePlacement.js";

const resolveAlignedPosition = ({
  anchorRect,
  popRect,
  placement,
  fallbackPlacements,
  offset,
  viewport,
  align,
  margin,
}) => {
  const placements = computePreferredPlacements(placement, fallbackPlacements);
  const resolution = resolvePlacement({
    anchorRect,
    popRect,
    placements,
    offset,
    viewport,
    margin,
  });
  const alignedPosition = alignPosition({
    resolution,
    align,
    anchorRect,
    popRect,
  });
  return { resolution, alignedPosition };
};

export function computePopoverPosition({
  anchorRect,
  popRect,
  placement,
  fallbackPlacements,
  align,
  offset,
  viewport,
  margin = VIEWPORT_MARGIN,
}) {
  const effectiveViewport = viewport ?? INFINITE_VIEWPORT;
  const { resolution, alignedPosition } = resolveAlignedPosition({
    anchorRect,
    popRect,
    placement,
    fallbackPlacements,
    offset,
    viewport: effectiveViewport,
    align,
    margin,
  });

  const position = clampToViewport({
    position: alignedPosition,
    popRect,
    viewport: effectiveViewport,
    margin,
    axis: resolution.axis,
  });

  return {
    position,
    placement: resolution.placement,
    axis: resolution.axis,
  };
}

export {
  alignPosition,
  clampToViewport,
  computePreferredPlacements,
  resolvePlacement,
  VIEWPORT_MARGIN,
};

export const INTERNAL_CONSTANTS = {
  VIEWPORT_MARGIN,
  PLACEMENT_CONFIG,
};
