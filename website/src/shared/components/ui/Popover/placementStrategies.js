/**
 * 背景：
 *  - Popover 的定位规则过去散落在组件内部，导致计算细节难以复用与测试。
 * 目的：
 *  - 通过集中封装定位策略，提供可预测的计算接口，便于未来扩展更多方向或校正逻辑。
 * 关键决策与取舍：
 *  - 选用策略表（Strategy Pattern）映射不同方位的几何计算，避免分支蔓延；
 *  - 将对齐与视窗裁剪也纳入同一纯函数，确保调用侧仅关注状态与渲染。
 * 影响范围：
 *  - Popover 组件及未来复用定位算法的弹出层能力。
 * 演进与TODO：
 *  - 后续可引入自适应宽度、箭头偏移等策略，并为 viewport 参数提供 mock 以便单测。
 */

const VIEWPORT_MARGIN = 8;

const PLACEMENT_CONFIG = {
  top: {
    axis: "vertical",
    compute(anchorRect, popRect, offset) {
      return {
        top: anchorRect.top - popRect.height - offset,
        left: anchorRect.left,
      };
    },
    fits({ top }, popRect, viewport) {
      const bottom = top + popRect.height;
      return top >= VIEWPORT_MARGIN && bottom <= viewport.height - VIEWPORT_MARGIN;
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
    fits({ top }, popRect, viewport) {
      const bottom = top + popRect.height;
      return bottom <= viewport.height - VIEWPORT_MARGIN;
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
    fits({ left }, popRect, viewport) {
      const right = left + popRect.width;
      return left >= VIEWPORT_MARGIN && right <= viewport.width - VIEWPORT_MARGIN;
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
    fits({ left }, popRect, viewport) {
      const right = left + popRect.width;
      return right <= viewport.width - VIEWPORT_MARGIN;
    },
  },
};

function clamp(value, min, max) {
  if (min > max) {
    return value;
  }
  if (value < min) return min;
  if (value > max) return max;
  return value;
}

/**
 * 意图：计算 Popover 在视窗内的最终位置与方位选择。
 * 输入：anchorRect/popRect 为 DOMRect，placement 为首选方向，fallbackPlacements 为兜底方向数组，align/offset 控制对齐与间距，viewport 提供当前视窗尺寸。
 * 输出：返回 { top, left, placement }，用于渲染绝对定位的浮层。
 * 流程：
 *  1) 根据首选 + 兜底方向依次尝试定位策略，并在首次适配视窗时提前返回；
 *  2) 根据对齐配置调整主轴与交叉轴位置；
 *  3) 在最终返回前对坐标进行裁剪，避免越界闪烁。
 * 错误处理：调用方需保证提供有效的 DOMRect，策略缺失时保底回退到底部。
 * 复杂度：最多遍历备选方向 O(n)，其余操作为常数时间。
 */
export function resolvePopoverPosition({
  anchorRect,
  popRect,
  placement,
  fallbackPlacements = [],
  align = "start",
  offset = 8,
  viewport,
}) {
  if (!anchorRect || !popRect) {
    return null;
  }

  const viewportSize =
    viewport ??
    (typeof window !== "undefined"
      ? { width: window.innerWidth, height: window.innerHeight }
      : null);

  const candidatePlacements = [placement, ...fallbackPlacements];

  let resolution = null;

  for (const candidate of candidatePlacements) {
    const config = PLACEMENT_CONFIG[candidate];
    if (!config) {
      continue;
    }
    const basePosition = config.compute(anchorRect, popRect, offset);
    const nextResolution = {
      placement: candidate,
      axis: config.axis,
      position: basePosition,
    };
    if (!resolution) {
      resolution = nextResolution;
    }
    if (
      viewportSize &&
      typeof viewportSize.width === "number" &&
      typeof viewportSize.height === "number" &&
      config.fits(basePosition, popRect, viewportSize)
    ) {
      resolution = nextResolution;
      break;
    }
  }

  if (!resolution) {
    resolution = {
      placement,
      axis: "vertical",
      position: { top: anchorRect.bottom + offset, left: anchorRect.left },
    };
  }

  let { top, left } = resolution.position;
  const resolvedPlacement = resolution.placement;
  const isVerticalAxis = resolution.axis === "vertical";

  if (isVerticalAxis) {
    if (align === "center") {
      left = anchorRect.left + anchorRect.width / 2 - popRect.width / 2;
    } else if (align === "end") {
      left = anchorRect.right - popRect.width;
    }
  } else if (align === "center") {
    top = anchorRect.top + anchorRect.height / 2 - popRect.height / 2;
  } else if (align === "end") {
    top = anchorRect.bottom - popRect.height;
  }

  if (viewportSize && typeof viewportSize.width === "number") {
    const minLeft = VIEWPORT_MARGIN;
    const maxLeft = viewportSize.width - popRect.width - VIEWPORT_MARGIN;
    left = clamp(left, minLeft, maxLeft);
  }

  if (viewportSize && typeof viewportSize.height === "number") {
    const minTop = VIEWPORT_MARGIN;
    const maxTop = viewportSize.height - popRect.height - VIEWPORT_MARGIN;
    top = clamp(top, minTop, maxTop);
  }

  return {
    top,
    left,
    placement: resolvedPlacement,
  };
}

export { VIEWPORT_MARGIN };
