import { VIEWPORT_MARGIN } from "./constants.js";

/**
 * Clamp a numeric value inside the [min, max] interval.
 */
export function clamp(value, min, max) {
  if (min > max) {
    return value;
  }
  if (value < min) return min;
  if (value > max) return max;
  return value;
}

/**
 * Ensure the popover position stays within the viewport safe area.
 */
export function clampToViewport({ position, popRect, viewport, margin, axis }) {
  const safeMargin = typeof margin === "number" ? margin : VIEWPORT_MARGIN;
  let { top, left } = position;

  if (axis === "vertical") {
    const minLeft = safeMargin;
    const maxLeft = viewport.width - popRect.width - safeMargin;
    left = clamp(left, minLeft, maxLeft);
    return { top, left };
  }

  const minTop = safeMargin;
  const maxTop = viewport.height - popRect.height - safeMargin;
  const minLeft = safeMargin;
  const maxLeft = viewport.width - popRect.width - safeMargin;

  top = clamp(top, minTop, maxTop);
  left = clamp(left, minLeft, maxLeft);

  return { top, left };
}
