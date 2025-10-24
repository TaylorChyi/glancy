/**
 * 测试目标：验证等待动画策略可生成多环波浪字符蓝图，并维持统一旋转速度。
 * 前置条件：使用默认策略模块，禁用额外参数注入。
 * 步骤：
 *  1) 动态导入策略对象。
 *  2) 调用 buildRings 获取圆环蓝图，并抽样首个字符的变换矩阵。
 * 断言：
 *  - rotationSpeedDegPerSec 为 49，对应设计要求。
 *  - buildRings 返回三个圆环，且首个圆环字符数量为 textLength * count。
 *  - composeRingGlyphs 输出的 transform 包含 rotateY 与 translateZ 关键字。
 * 边界/异常：
 *  - 未覆盖空文本输入，相关校验在策略内部处理。
 */
test("GivenStrategy_WhenBuildRings_ThenExposeWaveBlueprint", async () => {
  const { default: strategy } = await import("../waitingAnimationStrategy.cjs");

  expect(strategy.rotationSpeedDegPerSec).toBe(49);

  const rings = strategy.buildRings();
  expect(rings).toHaveLength(3);

  const firstRing = rings[0];
  expect(firstRing.glyphs).toHaveLength(
    strategy.ringBlueprints[0].textLength * strategy.baseParameters.count,
  );

  const sampleGlyph = firstRing.glyphs[0];
  expect(sampleGlyph.transform).toEqual(
    expect.stringContaining("rotateY"),
  );
  expect(sampleGlyph.transform).toEqual(
    expect.stringContaining("translateZ"),
  );
});
