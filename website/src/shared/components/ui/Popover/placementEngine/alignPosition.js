/**
 * Adjust a resolved placement position based on the requested alignment.
 */
export function alignPosition({ resolution, align, anchorRect, popRect }) {
  let { top, left } = resolution.position;
  if (resolution.axis === "vertical") {
    if (align === "center") {
      left = anchorRect.left + anchorRect.width / 2 - popRect.width / 2;
    } else if (align === "end") {
      left = anchorRect.right - popRect.width;
    }
  } else {
    if (align === "center") {
      top = anchorRect.top + anchorRect.height / 2 - popRect.height / 2;
    } else if (align === "end") {
      top = anchorRect.bottom - popRect.height;
    }
  }
  return { top, left };
}
