/**
 * 测试目标：验证等待动画策略输出统一节奏与尺寸，确保组件渲染时素材等高且 0.5 秒轮换。
 * 前置条件：使用默认策略模块，不注入额外参数。
 * 步骤：
 *  1) 动态导入策略对象。
 *  2) 调用 buildTimeline 生成三帧时间线。
 * 断言：
 *  - frameIntervalMs 恒为 500ms，对应 0.5 秒节奏。
 *  - durationFor 返回 1500ms，总时长为帧数 * 间隔。
 *  - delays 序列为 ["0ms", "-500ms", "-1000ms"]，保证依次触发。
 *  - canvas 高度恒定，保障素材等高呈现。
 * 边界/异常：
 *  - 若帧数非法应抛出 TypeError，本用例不覆盖异常路径。
 */
test("GivenStrategy_WhenTimelineGenerated_ThenRespectUniformIntervalAndCanvas", async () => {
  const { default: strategy } = await import("../waitingAnimationStrategy.cjs");

  expect(strategy.frameIntervalMs).toBe(500);
  expect(strategy.canvas.height).toBe(454);

  const timeline = strategy.buildTimeline(3);
  expect(strategy.durationFor(3)).toBe("1500ms");
  expect(timeline.interval).toBe("500ms");
  expect(timeline.duration).toBe("1500ms");
  expect(timeline.delays).toEqual(["0ms", "-500ms", "-1000ms"]);
});
