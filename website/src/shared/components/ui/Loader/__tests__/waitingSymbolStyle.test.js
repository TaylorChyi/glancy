/**
 * 背景：
 *  - waitingSymbolStyle 逻辑需要支持 mask + currentColor 的组合，同时保障高度与纵横比可配置。
 * 目的：
 *  - 通过纯函数单测验证 `buildWaitingSymbolStyle` 对尺寸、淡入时长与素材引用的组合逻辑。
 * 关键决策与取舍：
 *  - 覆盖正常路径与异常入参，确保在 Loader 之外复用时也具备稳定行为。
 * 影响范围：
 *  - Loader 组件与潜在复用方共享同一构建逻辑，此处的测试可作为回归保护。
 * 演进与TODO：
 *  - TODO：未来若加入主题维度，可在此扩展不同配置下的快照测试。
 */
import { buildWaitingSymbolStyle } from "../waitingSymbolStyle";

/**
 * 测试目标：验证 buildWaitingSymbolStyle 根据尺寸/时长/素材引用生成正确的 CSS 变量。
 * 前置条件：提供合法的尺寸对象、淡入时长与素材 URL 字符串。
 * 步骤：
 *  1) 调用函数生成样式对象。
 * 断言：
 *  - 高度变量采用 33vh 与像素值的 min 表达式。
 *  - 纵横比变量保留 6 位小数精度。
 *  - 羽化与遮罩尺寸变量根据素材尺寸推导后写入。
 *  - 渐隐时长与素材地址均写入对应变量。
 * 边界/异常：
 *  - 若后续新增参数，此测试需同步更新以维持语义准确。
 */
it("GivenDimensions_WhenBuildingStyle_ThenReturnsCssVariables", () => {
  const style = buildWaitingSymbolStyle(
    { width: 640, height: 360 },
    780,
    'url("asset.svg")',
  );

  expect(style).toEqual({
    "--waiting-frame-height": "min(33vh, 360px)",
    "--waiting-frame-aspect-ratio": Number((640 / 360).toFixed(6)),
    "--waiting-reveal-softness": "13.33%",
    "--waiting-reveal-mask-visible-size": "130%",
    "--waiting-fade-duration": "780ms",
    "--waiting-frame-image": 'url("asset.svg")',
  });
});

/**
 * 测试目标：当尺寸入参非法时，函数应抛出语义化错误阻止渲染。
 * 前置条件：传入 height 为 0 的尺寸对象，淡入时长与素材地址可为任意值。
 * 步骤：
 *  1) 调用函数并捕获异常。
 * 断言：
 *  - 抛出的错误信息包含 dimensions 相关提示，便于定位问题。
 * 边界/异常：
 *  - 同时覆盖 width 非数值等情况，确保防御性逻辑完整。
 */
it("GivenInvalidDimensions_WhenBuildingStyle_ThenThrows", () => {
  expect(() =>
    buildWaitingSymbolStyle({ width: 320, height: 0 }, 500, "url('asset.svg')"),
  ).toThrow(/dimensions/);
});
