import { INFINITE_VIEWPORT, PLACEMENT_CONFIG, VIEWPORT_MARGIN } from "./constants.js";

const FIT_CHECKERS = {
  top: ({ top, bottom }, bounds) => top >= bounds.top && bottom <= bounds.bottom,
  bottom: ({ bottom }, bounds) => bottom <= bounds.bottom,
  left: ({ left, right }, bounds) => left >= bounds.left && right <= bounds.right,
  right: ({ right }, bounds) => right <= bounds.right,
};

const isUnboundedViewport = (viewport) =>
  viewport.width === Number.POSITIVE_INFINITY &&
  viewport.height === Number.POSITIVE_INFINITY;

const resolveViewportBounds = (viewport, margin) => ({
  top: margin,
  left: margin,
  bottom: viewport.height - margin,
  right: viewport.width - margin,
});

const resolvePopoverEdges = (position, popRect) => ({
  top: position.top,
  left: position.left,
  bottom: position.top + popRect.height,
  right: position.left + popRect.width,
});

const defaultBoundsChecker = (edges, bounds) =>
  edges.top >= bounds.top &&
  edges.left >= bounds.left &&
  edges.bottom <= bounds.bottom &&
  edges.right <= bounds.right;

const fitsWithinViewport = ({ placement, position, popRect, viewport, margin }) => {
  const effectiveViewport = viewport ?? INFINITE_VIEWPORT;
  if (isUnboundedViewport(effectiveViewport)) {
    return true;
  }

  const bounds = resolveViewportBounds(effectiveViewport, margin ?? VIEWPORT_MARGIN);
  const edges = resolvePopoverEdges(position, popRect);
  const checker = FIT_CHECKERS[placement] ?? defaultBoundsChecker;
  return checker(edges, bounds);
};

const evaluatePlacementCandidate = ({
  candidate,
  anchorRect,
  popRect,
  offset,
  viewport,
  margin,
}) => {
  const config = PLACEMENT_CONFIG[candidate];
  if (!config) {
    return null;
  }
  const position = config.compute(anchorRect, popRect, offset);
  const resolution = {
    placement: candidate,
    axis: config.axis,
    position,
  };
  const fits = fitsWithinViewport({
    placement: candidate,
    position,
    popRect,
    viewport,
    margin,
  });
  return { resolution, fits };
};

const buildFallbackResolution = (anchorRect, popRect, offset) => {
  const fallbackConfig = PLACEMENT_CONFIG.bottom;
  return {
    placement: "bottom",
    axis: fallbackConfig.axis,
    position: fallbackConfig.compute(anchorRect, popRect, offset),
  };
};

/**
 * Produce a deduplicated list of placement candidates ordered by priority.
 */
export function computePreferredPlacements(primary, fallbacks = []) {
  const unique = new Set();
  const orderedPlacements = [];
  [primary, ...fallbacks].forEach((candidate) => {
    if (!candidate || unique.has(candidate)) {
      return;
    }
    unique.add(candidate);
    orderedPlacements.push(candidate);
  });
  return orderedPlacements;
}

/**
 * Resolve the first placement candidate that fits inside the provided viewport.
 */
export function resolvePlacement({
  anchorRect,
  popRect,
  placements,
  offset,
  viewport,
  margin,
}) {
  const safePlacements = placements.length ? placements : ["bottom"];
  let firstResolution = null;

  for (const candidate of safePlacements) {
    const evaluation = evaluatePlacementCandidate({
      candidate,
      anchorRect,
      popRect,
      offset,
      viewport,
      margin,
    });
    if (!evaluation) {
      continue;
    }
    if (!firstResolution) {
      firstResolution = evaluation.resolution;
    }
    if (evaluation.fits) {
      return evaluation.resolution;
    }
  }

  return firstResolution ?? buildFallbackResolution(anchorRect, popRect, offset);
}
