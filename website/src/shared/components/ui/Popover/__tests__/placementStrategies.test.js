import { resolvePopoverPosition } from "../placementStrategies";

function toRect({ top = 0, left = 0, width = 0, height = 0 }) {
  return {
    top,
    left,
    width,
    height,
    right: left + width,
    bottom: top + height,
  };
}

/**
 * 测试目标：验证在主方向越界时 resolvePopoverPosition 会选择 fallback。
 * 前置条件：主方向为 top，锚点紧贴窗口顶部，视窗高度受限。
 * 步骤：
 *  1) 构造锚点与浮层尺寸，并设置 viewport 模拟高度不足。
 *  2) 调用 resolvePopoverPosition 并获取结果。
 * 断言：
 *  - placement 应为 bottom 且 top 坐标在视窗内；失败提示回退策略缺失。
 * 边界/异常：
 *  - 若 viewport 未传入时依赖 window，这里通过自定义 viewport 避免环境耦合。
 */
test("resolvePopoverPosition falls back when primary placement overflows", () => {
  const anchorRect = toRect({ top: 8, left: 100, width: 80, height: 40 });
  const popRect = toRect({ width: 140, height: 120 });
  const viewport = { width: 1024, height: 300 };

  const result = resolvePopoverPosition({
    anchorRect,
    popRect,
    placement: "top",
    fallbackPlacements: ["bottom"],
    align: "start",
    offset: 12,
    viewport,
  });

  expect(result?.placement).toBe("bottom");
  expect(result?.top).toBeCloseTo(8 + 40 + 12);
  expect(result?.top).toBeLessThan(viewport.height);
});

/**
 * 测试目标：验证水平布局时 center 对齐能正确居中并裁剪。
 * 前置条件：主方向为 left，提供大尺寸视窗以触发 clamp。
 * 步骤：
 *  1) 构造锚点与浮层尺寸；
 *  2) 调用 resolvePopoverPosition 并比对 top/left。
 * 断言：
 *  - placement 保持 left，top 居中且 left 经过 clamp；失败提示对齐或裁剪逻辑异常。
 * 边界/异常：
 *  - 如果 clamp 逻辑失效则 top/left 会越界。
 */
test("resolvePopoverPosition centers horizontally aligned popovers", () => {
  const anchorRect = toRect({ top: 120, left: 900, width: 60, height: 80 });
  const popRect = toRect({ width: 200, height: 200 });
  const viewport = { width: 960, height: 600 };

  const result = resolvePopoverPosition({
    anchorRect,
    popRect,
    placement: "left",
    fallbackPlacements: [],
    align: "center",
    offset: 16,
    viewport,
  });

  expect(result?.placement).toBe("left");
  expect(result?.top).toBeCloseTo(120 + 80 / 2 - 200 / 2);
  expect(result?.left).toBeGreaterThanOrEqual(8);
});
