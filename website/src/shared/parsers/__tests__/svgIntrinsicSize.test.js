import { extractSvgIntrinsicSize } from "../svgIntrinsicSize.js";

describe("extractSvgIntrinsicSize", () => {
  /**
   * 测试目标：验证显式像素尺寸解析逻辑。
   * 前置条件：传入带有 width/height 的 SVG 片段。
   * 步骤：
   *  1) 调用 extractSvgIntrinsicSize 解析 SVG 文本；
   * 断言：
   *  - 返回对象的宽高分别等于属性值；
   * 边界/异常：
   *  - 属性包含 px 后缀，应被忽略。
   */
  it("GivenPixelSizedSvg_WhenParsed_ThenReturnsNumericDimensions", () => {
    const svg = '<svg width="128px" height="64"></svg>';
    expect(extractSvgIntrinsicSize(svg)).toEqual({ width: 128, height: 64 });
  });

  /**
   * 测试目标：验证物理单位自动换算像素能力。
   * 前置条件：SVG width/height 使用 in/cm 等单位。
   * 步骤：
   *  1) 解析带有不同物理单位的 SVG 文本；
   * 断言：
   *  - 返回值换算为像素后满足精度要求；
   * 边界/异常：
   *  - 保证多个单位均可解析。
   */
  it("GivenPhysicalLengthUnits_WhenParsed_ThenConvertsToPixels", () => {
    const svg = '<svg width="2in" height="5cm"></svg>';
    const result = extractSvgIntrinsicSize(svg);
    expect(result?.width).toBeCloseTo(192);
    expect(result?.height).toBeCloseTo((96 / 2.54) * 5, 5);
  });

  /**
   * 测试目标：验证缺失显式尺寸时回退 viewBox 的逻辑。
   * 前置条件：SVG 仅包含 viewBox 或非数值属性。
   * 步骤：
   *  1) 解析仅有 viewBox 的 SVG 文本；
   *  2) 解析 width/height 为百分比的 SVG 文本；
   * 断言：
   *  - 在无法解析数值时正确回退 viewBox；
   * 边界/异常：
   *  - 百分比尺寸不应被误判为有效像素。
   */
  it("GivenInvalidNumericAttributes_WhenViewBoxPresent_ThenFallsBackToViewBox", () => {
    const svgOnlyViewBox = '<svg viewBox="0 0 256 512"></svg>';
    expect(extractSvgIntrinsicSize(svgOnlyViewBox)).toEqual({
      width: 256,
      height: 512,
    });

    const svgWithPercent =
      '<svg width="100%" height="100%" viewBox="0 0 300 150"></svg>';
    expect(extractSvgIntrinsicSize(svgWithPercent)).toEqual({
      width: 300,
      height: 150,
    });
  });

  /**
   * 测试目标：验证非法输入时安全返回 null。
   * 前置条件：传入空字符串或非 SVG 文本。
   * 步骤：
   *  1) 调用解析函数；
   * 断言：
   *  - 返回值为 null；
   * 边界/异常：
   *  - 覆盖非 SVG 标签的场景。
   */
  it("GivenInvalidInput_WhenParsed_ThenReturnsNull", () => {
    expect(extractSvgIntrinsicSize("")).toBeNull();
    expect(extractSvgIntrinsicSize("<not-svg></not-svg>")).toBeNull();
  });
});
