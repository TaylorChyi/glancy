/**
 * 背景：
 *  - CSS.supports 在部分旧内核上会返回 true 但遮罩实际未生效，导致图标渲染出空白背景。
 * 目的：
 *  - 验证 detectMaskSupport 对 computed style 的二次校验逻辑，确保仅在遮罩真正应用成功时返回 true。
 * 关键决策与取舍：
 *  - 通过覆写 getComputedStyle 与 CSS.supports 行为模拟不同内核，避免依赖真实浏览器。
 * 影响范围：
 *  - ChatInput 图标的能力探测，间接影响所有依赖遮罩的 UI 原子。
 * 演进与TODO：
 *  - 可补充对 maskImage/maskComposite 等属性的更多探测场景，覆盖未来扩展。
 */

import { jest } from "@jest/globals";

const originalCSS = global.CSS;
const originalWindowCSS = typeof window !== "undefined" ? window.CSS : undefined;
const originalGetComputedStyle =
  typeof window !== "undefined" ? window.getComputedStyle : undefined;

const { detectMaskSupport } = await import("../useMaskSupport.js");

describe("detectMaskSupport", () => {
  beforeEach(() => {
    const cssMock = {
      supports: jest.fn((property) => property === "mask" || property === "-webkit-mask"),
    };
    global.CSS = cssMock;
    if (typeof window !== "undefined") {
      window.CSS = cssMock;
    }
  });

  afterEach(() => {
    if (typeof window !== "undefined") {
      window.getComputedStyle = originalGetComputedStyle;
      window.CSS = originalWindowCSS;
    }
    global.CSS = originalCSS;
  });

  /**
   * 测试目标：当 computed style 返回 url() 时，detectMaskSupport 应判定为支持遮罩。
   * 前置条件：CSS.supports 对 mask 返回 true，getComputedStyle 返回 url() 值。
   * 步骤：
   *  1) mock getComputedStyle 返回包含 url() 的 mask-image。
   *  2) 调用 detectMaskSupport。
   * 断言：
   *  - 返回 true。
   * 边界/异常：
   *  - 若 future browser 返回不同格式，应扩展函数的取值解析策略。
   */
  test("GivenComputedStyleContainsUrl_WhenDetecting_ThenReturnTrue", () => {
    if (typeof window === "undefined") {
      throw new Error("window is required for this test");
    }

    const computedStyleMock = {
      getPropertyValue: jest.fn((property) =>
        property === "mask-image" || property === "mask"
          ? 'url("data:image/svg+xml;base64,PHN2Zy8+")'
          : "",
      ),
      maskImage: 'url("data:image/svg+xml;base64,PHN2Zy8+")',
    };
    window.getComputedStyle = jest.fn(() => computedStyleMock);

    expect(detectMaskSupport()).toBe(true);
  });

  /**
   * 测试目标：当 computed style 返回 none 时，即便 CSS.supports 返回 true 也应判定为不支持。
   * 前置条件：CSS.supports 均返回 true，getComputedStyle 仅返回 none。
   * 步骤：
   *  1) mock getComputedStyle 始终返回 none。
   *  2) 调用 detectMaskSupport。
   * 断言：
   *  - 返回 false。
   * 边界/异常：
   *  - 若未来引入更多属性，应同步调整探测逻辑。
   */
  test("GivenComputedStyleIsNone_WhenDetecting_ThenReturnFalse", () => {
    if (typeof window === "undefined") {
      throw new Error("window is required for this test");
    }

    const computedStyleMock = {
      getPropertyValue: jest.fn(() => "none"),
      maskImage: "none",
      webkitMaskImage: "none",
    };
    window.getComputedStyle = jest.fn(() => computedStyleMock);

    expect(detectMaskSupport()).toBe(false);
  });
});
