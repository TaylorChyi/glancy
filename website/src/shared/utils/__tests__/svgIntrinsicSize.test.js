/**
 * 背景：
 *  - SVG 图标在缺失显式宽高时 naturalWidth/naturalHeight 为 0，
 *    需要通过解析文本恢复固有尺寸。
 * 测试目标：
 *  - 验证 extractSvgIntrinsicSize 能正确解析 width/height 与 viewBox。
 * 前置条件：
 *  - 运行于 jsdom 环境，DOMParser 可用。
 * 步骤：
 *  1) 构造带有显式 width/height 的 SVG 并断言解析结果；
 *  2) 构造仅含 viewBox 的 SVG 并断言解析结果；
 *  3) 构造非法输入断言返回 null。
 * 断言：
 *  - 输出的宽高匹配预期值，非法输入返回 null。
 * 边界/异常：
 *  - 覆盖空字符串与非 SVG XML 的场景。
 */
import { extractSvgIntrinsicSize } from "../svgIntrinsicSize.js";

describe("extractSvgIntrinsicSize", () => {
  it("parses explicit width and height", () => {
    const svg = '<svg width="128px" height="64"></svg>';
    expect(extractSvgIntrinsicSize(svg)).toEqual({ width: 128, height: 64 });
  });

  it("falls back to viewBox when width/height missing", () => {
    const svg = '<svg viewBox="0 0 256 512"></svg>';
    expect(extractSvgIntrinsicSize(svg)).toEqual({ width: 256, height: 512 });
  });

  it("returns null when unable to resolve size", () => {
    expect(extractSvgIntrinsicSize("")).toBeNull();
    expect(extractSvgIntrinsicSize("<not-svg></not-svg>")).toBeNull();
  });
});
