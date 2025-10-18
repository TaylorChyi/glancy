import {
  computePopoverPosition,
  computePreferredPlacements,
  clampToViewport,
} from "../placementEngine";

const BASE_ANCHOR_RECT = {
  top: 100,
  left: 100,
  right: 160,
  bottom: 140,
  width: 60,
  height: 40,
};

const BASE_POP_RECT = {
  width: 80,
  height: 40,
};

const DEFAULT_VIEWPORT = { width: 400, height: 400 };

function createRect(overrides = {}) {
  return { ...BASE_ANCHOR_RECT, ...overrides };
}

describe("placementEngine helpers", () => {
  /**
   * 测试目标：验证 computePreferredPlacements 能去重并保持顺序。
   * 前置条件：传入主 placement 与包含重复的备用数组。
   * 步骤：
   *  1) 调用 computePreferredPlacements。
   *  2) 获取返回数组。
   * 断言：
   *  - 返回数组与预期顺序一致。
   * 边界/异常：
   *  - 覆盖重复元素被去除的场景。
   */
  test("Given duplicate fallbacks When computing preferred placements Then duplicates are removed", () => {
    const result = computePreferredPlacements("bottom", ["bottom", "top", "left"]);
    expect(result).toEqual(["bottom", "top", "left"]);
  });

  /**
   * 测试目标：验证 computePopoverPosition 优先使用主方向并保持位置。
   * 前置条件：主方向 bottom 有足够空间。
   * 步骤：
   *  1) 构造锚点与浮层矩形。
   *  2) 调用 computePopoverPosition。
   * 断言：
   *  - placement 为 bottom。
   *  - top/left 符合预期。
   * 边界/异常：
   *  - 使用自定义视窗，避免依赖真实 DOM。
   */
  test("Given ample space When computing position Then primary placement is used", () => {
    const { position, placement } = computePopoverPosition({
      anchorRect: createRect(),
      popRect: { width: 80, height: 40 },
      placement: "bottom",
      fallbackPlacements: ["top"],
      align: "start",
      offset: 8,
      viewport: DEFAULT_VIEWPORT,
    });

    expect(placement).toBe("bottom");
    expect(position).toEqual({ top: 148, left: 100 });
  });

  /**
   * 测试目标：验证当主方向空间不足时会选择备用方向。
   * 前置条件：视窗高度受限导致 bottom 溢出。
   * 步骤：
   *  1) 设置较小视窗高度。
   *  2) 调用 computePopoverPosition。
   * 断言：
   *  - placement 为 top。
   *  - 位置按备用策略计算。
   * 边界/异常：
   *  - 确认 fallback 生效。
   */
  test("Given insufficient space When computing position Then fallback placement is chosen", () => {
    const { position, placement } = computePopoverPosition({
      anchorRect: createRect({ top: 360, bottom: 400 }),
      popRect: { width: 80, height: 60 },
      placement: "bottom",
      fallbackPlacements: ["top"],
      align: "start",
      offset: 8,
      viewport: { width: 400, height: 380 },
    });

    expect(placement).toBe("top");
    expect(position).toEqual({ top: 292, left: 100 });
  });

  /**
   * 测试目标：验证 clampToViewport 能在水平方向裁剪位置。
   * 前置条件：传入超出视窗的 left/top。
   * 步骤：
   *  1) 调用 clampToViewport 并传入水平轴配置。
   *  2) 获取裁剪后的结果。
   * 断言：
   *  - top/left 均被限制在安全范围内。
   * 边界/异常：
   *  - 使用极端左侧溢出值。
   */
  test("Given overflow position When clamping Then value is bounded", () => {
    const result = clampToViewport({
      position: { top: -50, left: -120 },
      popRect: BASE_POP_RECT,
      viewport: DEFAULT_VIEWPORT,
      margin: 8,
      axis: "horizontal",
    });

    expect(result.top).toBe(8);
    expect(result.left).toBe(8);
  });
});
