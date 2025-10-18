/**
 * 背景：
 *  - Popover 现有定位逻辑集中在组件内部，导致单个函数行数与复杂度超出 lint 限制。
 * 目的：
 *  - 抽离几何计算策略，输出纯函数便于复用与单元测试，降低组件职责耦合。
 * 关键决策与取舍：
 *  - 采用策略映射封装不同方向的定位逻辑，符合开闭原则，方便未来新增策略；
 *  - 通过显式传入视窗尺寸实现可测试性，而不是在函数内部直接访问 window。
 * 影响范围：
 *  - 提供 Popover 组件复用的纯函数，便于后续在其他触发器场景中共享。
 * 演进与TODO：
 *  - 后续可在此模块扩展碰撞检测或适配 RTL 布局的特殊策略。
 */

const VIEWPORT_MARGIN = 8;
const INFINITE_VIEWPORT = { width: Number.POSITIVE_INFINITY, height: Number.POSITIVE_INFINITY };

const PLACEMENT_CONFIG = {
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

// 方向 -> 视窗适配判断器，便于降低循环复杂度。
const FIT_CHECKERS = {
  top: ({ top, bottom }, bounds) => top >= bounds.top && bottom <= bounds.bottom,
  bottom: ({ bottom }, bounds) => bottom <= bounds.bottom,
  left: ({ left, right }, bounds) =>
    left >= bounds.left && right <= bounds.right,
  right: ({ right }, bounds) => right <= bounds.right,
};

/**
 * 意图：判断给定 position 是否在视窗安全区内。
 * 输入：placement、position、浮层尺寸、视窗尺寸与安全边距。
 * 输出：布尔值表示是否在安全区内。
 */
function fitsWithinViewport({
  placement,
  position,
  popRect,
  viewport,
  margin = VIEWPORT_MARGIN,
}) {
  const effectiveViewport = viewport ?? INFINITE_VIEWPORT;
  if (
    effectiveViewport.width === Number.POSITIVE_INFINITY &&
    effectiveViewport.height === Number.POSITIVE_INFINITY
  ) {
    return true;
  }

  const bounds = {
    top: margin,
    left: margin,
    bottom: effectiveViewport.height - margin,
    right: effectiveViewport.width - margin,
  };
  const edges = {
    top: position.top,
    left: position.left,
    bottom: position.top + popRect.height,
    right: position.left + popRect.width,
  };

  const checker = FIT_CHECKERS[placement];
  if (checker) {
    return checker(edges, bounds);
  }

  return (
    edges.top >= bounds.top &&
    edges.left >= bounds.left &&
    edges.bottom <= bounds.bottom &&
    edges.right <= bounds.right
  );
}

/**
 * 意图：提供统一方式获取视窗尺寸，在 SSR 或测试环境中返回无限空间以避免截断。
 * 输入：可选的 window 对象。
 * 输出：包含 width 与 height 的视窗维度对象。
 * 流程：
 *  1) 若提供 window 或全局存在 window，则读取 innerWidth/innerHeight；
 *  2) 否则返回无穷大视窗，表示无需裁剪。
 */
export function getViewportMetrics(targetWindow = typeof window === "undefined" ? undefined : window) {
  if (!targetWindow) {
    return INFINITE_VIEWPORT;
  }
  return {
    width: targetWindow.innerWidth,
    height: targetWindow.innerHeight,
  };
}

/**
 * 意图：生成主候选与备用候选的去重列表，确保顺序稳定。
 * 输入：placement 字符串与备用 placement 数组。
 * 输出：按优先级排列、不含重复项的 placement 列表。
 * 流程：
 *  1) 依次遍历主 placement 与备用列表；
 *  2) 通过 Set 去重；
 *  3) 返回最终数组。
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
 * 意图：在候选 placement 中选择第一个可容纳 Popover 的定位方案。
 * 输入：锚点矩形、浮层矩形、候选 placement 列表、偏移距离、视窗尺寸。
 * 输出：包含 placement、axis 与 position(top/left) 的解析结果。
 * 流程：
 *  1) 遍历候选 placement，计算基准 position；
 *  2) 判断该 position 是否在视窗范围内；
 *  3) 选择第一个满足条件的方案，否则回退到主 placement。
 * 错误处理：如无任何有效 placement，则返回默认 bottom 方案避免崩溃。
 */
export function resolvePlacement({
  anchorRect,
  popRect,
  placements,
  offset,
  viewport,
}) {
  let resolution = null;
  const safePlacements = placements.length ? placements : ["bottom"];

  for (const candidate of safePlacements) {
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
    if (fitsWithinViewport({
      placement: candidate,
      position: basePosition,
      popRect,
      viewport,
    })) {
      resolution = nextResolution;
      break;
    }
  }

  if (!resolution) {
    const fallbackConfig = PLACEMENT_CONFIG.bottom;
    resolution = {
      placement: "bottom",
      axis: fallbackConfig.axis,
      position: fallbackConfig.compute(anchorRect, popRect, offset),
    };
  }

  return resolution;
}

/**
 * 意图：根据对齐方式调整 position 值，保持轴线语义明确。
 * 输入：解析结果、对齐方式、锚点矩形、浮层矩形。
 * 输出：带有 top/left 的位置对象。
 * 流程：
 *  1) 判断轴向（vertical/horizontal）；
 *  2) 根据 align 值计算中心或末端对齐；
 *  3) 返回新的 top/left。
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

/**
 * 意图：在给定区间内约束某个数值。
 * 输入：数值、最小值、最大值。
 * 输出：经过裁剪后的数值。
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
 * 意图：将浮层位置裁剪到视窗安全区域内，避免出现不可见部分。
 * 输入：位置对象、浮层矩形、视窗尺寸、边距、轴向。
 * 输出：裁剪后的 top/left。
 * 流程：
 *  1) 若主轴为垂直，则至少裁剪 X 轴；
 *  2) 若主轴为水平，则同时裁剪 X/Y；
 *  3) 使用 clamp 函数限制值在边界内。
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

/**
 * 意图：综合候选方向、对齐与视窗裁剪策略，输出最终浮层位置。
 * 输入：锚点矩形、浮层矩形、placement 参数、备用方向、对齐方式、偏移、视窗信息。
 * 输出：包含位置与生效 placement 的对象。
 * 流程：
 *  1) 生成候选 placement 列表；
 *  2) 解析最合适的方向与基础位置；
 *  3) 根据对齐方式调整位置；
 *  4) 将结果裁剪到视窗安全区域内。
 *  5) 返回 { position, placement } 供外部使用。
 * 复杂度：O(n) 遍历候选列表；空间复杂度 O(1)。
 */
export function computePopoverPosition({
  anchorRect,
  popRect,
  placement,
  fallbackPlacements,
  align,
  offset,
  viewport = getViewportMetrics(),
  margin = VIEWPORT_MARGIN,
}) {
  const placements = computePreferredPlacements(placement, fallbackPlacements);
  const resolution = resolvePlacement({
    anchorRect,
    popRect,
    placements,
    offset,
    viewport,
  });
  const alignedPosition = alignPosition({
    resolution,
    align,
    anchorRect,
    popRect,
  });
  const position = clampToViewport({
    position: alignedPosition,
    popRect,
    viewport,
    margin,
    axis: resolution.axis,
  });

  return {
    position,
    placement: resolution.placement,
    axis: resolution.axis,
  };
}

export const INTERNAL_CONSTANTS = {
  VIEWPORT_MARGIN,
  PLACEMENT_CONFIG,
};
