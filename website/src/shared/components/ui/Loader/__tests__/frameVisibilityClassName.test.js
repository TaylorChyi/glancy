import frameVisibilityClassName from "../frameVisibilityClassName";

/**
 * 测试目标：验证透明度类名组合函数能在不同可见态下输出预期字符串。
 * 前置条件：输入的基础类名为 "frame"，可见态类名为 "frame-visible"。
 * 步骤：
 *  1) 调用函数并传入 isRevealed=false；
 *  2) 再次调用函数并传入 isRevealed=true；
 *  3) 传入空的可见态类名验证降级行为；
 * 断言：
 *  - 初始态仅返回基础类名；
 *  - 可见态返回基础类 + 可见态类；
 *  - 可见态类名缺失时仅返回基础类名。
 * 边界/异常：
 *  - 未覆盖多状态串联，后续如引入更多层级需在此补测。
 */
describe("frameVisibilityClassName", () => {
  it("GivenBooleanFlag_WhenFalse_ThenReturnBaseClass", () => {
    expect(frameVisibilityClassName("frame", "frame-visible", false)).toBe(
      "frame",
    );
  });

  it("GivenBooleanFlag_WhenTrue_ThenAppendVisibleClass", () => {
    expect(frameVisibilityClassName("frame", "frame-visible", true)).toBe(
      "frame frame-visible",
    );
  });

  it("GivenMissingVisibleClass_WhenToggle_ThenReturnBaseOnly", () => {
    expect(frameVisibilityClassName("frame", "", true)).toBe("frame");
  });
});
