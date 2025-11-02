/**
 * 测试目标：确保 composeRingGlyphs 根据输入文本生成稳定可预测的 3D 变换序列。
 * 前置条件：显式传入覆盖配置，避免依赖默认相位与偏移。
 * 步骤：
 *  1) 动态导入策略对象。
 *  2) 调用 composeRingGlyphs 生成字符列表。
 * 断言：
 *  - 返回字符数量等于文本长度 * count。
 *  - 首个字符保持原始字形且变换矩阵为确定值。
 *  - 第二个字符随波浪产生纵向位移。
 * 边界/异常：
 *  - 未覆盖文本为空的场景，对应策略已返回空数组。
 */
test("GivenText_WhenComposeRingGlyphs_ThenProduceDeterministicTransforms", async () => {
  const { default: strategy } = await import("../waitingAnimationStrategy.cjs");

  const glyphs = strategy.composeRingGlyphs("▍▋", {
    id: "ring-spec",
    phaseShift: 0,
    offset: 0,
  });

  expect(glyphs).toHaveLength(2 * strategy.baseParameters.count);
  expect(glyphs[0]).toMatchObject({
    char: "▍",
    transform:
      "rotateY(10deg) translateZ(218px) translateY(0px)" +
      " rotateX(20deg) rotateY(45deg) rotateZ(19deg) scale(1, 1.6)",
  });

  expect(glyphs[1].char).toBe("▋");
  expect(glyphs[1].transform).toEqual(
    expect.stringContaining("translateY"),
  );
  expect(glyphs[1].transform).not.toContain("translateY(0px)");
});
