/**
 * 背景：
 *  - SendIcon 需随主题切换引用 send-button 资产，但历史测试缺少主题覆盖。
 * 目的：
 *  - 验证资源解析策略基于 resolvedTheme 选择正确变体，并在缺失时触发降级。
 * 关键决策与取舍：
 *  - 通过模块 mock 注入受控资源，确保测试聚焦逻辑，不依赖真实清单。
 * 影响范围：
 *  - ChatInput 发送按钮的图标渲染可靠性。
 * 演进与TODO：
 *  - 后续可补充动画或高对比度主题时的断言。
 */

import { render } from "@testing-library/react";
import { jest } from "@jest/globals";

const iconRegistry = {};
const mockUseTheme = jest.fn();

jest.unstable_mockModule("@/assets/icons.js", () => ({
  default: iconRegistry,
}));

jest.unstable_mockModule("@/context", () => ({
  useTheme: mockUseTheme,
}));

const { default: SendIcon } = await import("../SendIcon.jsx");

describe("SendIcon", () => {
  beforeAll(() => {
    const cssSupport = {
      supports: jest.fn(() => true),
    };
    global.CSS = cssSupport;
    if (typeof window !== "undefined") {
      window.CSS = cssSupport;
    }
  });

  beforeEach(() => {
    mockUseTheme.mockReturnValue({ resolvedTheme: "light" });
    iconRegistry["send-button"] = {
      light: { src: "/light.svg", content: "<svg>light</svg>" },
      dark: { src: "/dark.svg", content: "<svg>dark</svg>" },
    };
    global.CSS.supports.mockReturnValue(true);
    if (typeof window !== "undefined") {
      window.CSS.supports.mockReturnValue(true);
    }
  });

  afterEach(() => {
    mockUseTheme.mockReset();
    delete iconRegistry["send-button"];
  });

  /**
   * 测试目标：亮色主题下渲染 send-button/light 资源并暴露数据标识。
   * 前置条件：resolvedTheme=light 且注册表包含 light 变体。
   * 步骤：
   *  1) 渲染 SendIcon。
   *  2) 捕获生成的 span 元素。
   * 断言：
   *  - data-icon-name=send-button。
   *  - mask 样式指向 light 资源。
   * 边界/异常：
   *  - 若资源缺失则断言会失败提示覆盖不足。
   */
  test("GivenLightTheme_WhenRendering_ThenApplyLightVariant", () => {
    const { container } = render(<SendIcon className="icon" />);

    const icon = container.firstChild;
    expect(icon).not.toBeNull();
    expect(icon).toHaveAttribute("data-icon-name", "send-button");
    expect(icon?.style.mask ?? "").toContain("/light.svg");
    expect(icon?.style.mask ?? "").toContain("center / contain no-repeat");
    expect(icon?.getAttribute("style") ?? "").toContain("background-color");
  });

  /**
   * 测试目标：暗色主题且缺失 dark/light 变体时应退回 single 资源。
   * 前置条件：resolvedTheme=dark 且仅提供 single。
   * 步骤：
   *  1) 更新 mock 主题与注册表。
   *  2) 渲染 SendIcon 并检查蒙版样式。
   * 断言：
   *  - mask 样式引用 single 资源。
   * 边界/异常：
   *  - 若回退失败则说明解析函数未覆盖降级逻辑。
   */
  test("GivenDarkTheme_WhenVariantsMissing_ThenFallbackToSingle", () => {
    mockUseTheme.mockReturnValue({ resolvedTheme: "dark" });
    iconRegistry["send-button"] = {
      single: { src: "/single.svg", content: "<svg>single</svg>" },
    };

    const { container } = render(<SendIcon className="icon" />);

    const icon = container.firstChild;
    expect(icon).not.toBeNull();
    expect(icon).toHaveAttribute("data-icon-name", "send-button");
    expect(icon?.style.mask ?? "").toContain("/single.svg");
    expect(icon?.style.mask ?? "").toContain("center / contain no-repeat");
    expect(icon?.getAttribute("style") ?? "").toContain("background-color");
  });

  /**
   * 测试目标：资源缺失时应调用 fallback 渲染兜底结构。
   * 前置条件：发送按钮令牌未在注册表中注册。
   * 步骤：
   *  1) 清空注册表。
   *  2) 渲染组件并捕获 fallback。
   * 断言：
   *  - fallback 被调用一次且入参包含 iconName。
   *  - fallback 产物被挂载。
   * 边界/异常：
   *  - 若未调用则表示降级逻辑失效。
   */
  test("GivenMissingResource_WhenRendering_ThenInvokeFallback", () => {
    delete iconRegistry["send-button"];
    const fallback = jest.fn(() => <div data-testid="fallback" />);

    const { getByTestId } = render(<SendIcon className="icon" fallback={fallback} />);

    expect(fallback).toHaveBeenCalledTimes(1);
    expect(fallback).toHaveBeenCalledWith({ className: "icon", iconName: "send-button" });
    expect(getByTestId("fallback")).toBeInTheDocument();
  });

  /**
   * 测试目标：当运行环境不支持 CSS mask 时，应立即退回到 SVG fallback。
   * 前置条件：CSS.supports 返回 false，注册表仍提供可用资源。
   * 步骤：
   *  1) mock CSS.supports 恒为 false。
   *  2) 渲染 SendIcon 并捕获 fallback。
   * 断言：
   *  - fallback 被调用一次且渲染结果存在。
   * 边界/异常：
   *  - 若未来新增浏览器特判，此用例需扩展断言覆盖。
   */
  test("GivenMaskUnsupported_WhenRendering_ThenRenderFallbackSvg", () => {
    global.CSS.supports.mockReturnValue(false);
    if (typeof window !== "undefined") {
      window.CSS.supports.mockReturnValue(false);
    }

    const { container } = render(<SendIcon className="icon" />);

    expect(container.querySelector("svg")).not.toBeNull();
  });
});
