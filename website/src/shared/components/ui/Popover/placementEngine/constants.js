export const VIEWPORT_MARGIN = 8;

export const INFINITE_VIEWPORT = {
  width: Number.POSITIVE_INFINITY,
  height: Number.POSITIVE_INFINITY,
};

export const PLACEMENT_CONFIG = {
  top: {
    axis: "vertical",
    compute(anchorRect, popRect, offset) {
      return {
        top: anchorRect.top - popRect.height - offset,
        left: anchorRect.left,
      };
    },
  },
  bottom: {
    axis: "vertical",
    compute(anchorRect, popRect, offset) {
      return {
        top: anchorRect.bottom + offset,
        left: anchorRect.left,
      };
    },
  },
  left: {
    axis: "horizontal",
    compute(anchorRect, popRect, offset) {
      return {
        top: anchorRect.top,
        left: anchorRect.left - popRect.width - offset,
      };
    },
  },
  right: {
    axis: "horizontal",
    compute(anchorRect, popRect, offset) {
      return {
        top: anchorRect.top,
        left: anchorRect.right + offset,
      };
    },
  },
};
