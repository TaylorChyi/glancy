/* eslint-env jest */
import { render } from "@testing-library/react";
import { jest } from "@jest/globals";

/**
 * 背景：
 *  - SendIcon 迁移到 createMaskedIconRenderer 模板后，需要验证策略函数在不同主题、资源缺失与遮罩不可用时的分支行为。
 * 目的：
 *  - 模拟主题、遮罩能力与图标注册表，确保发送图标始终能渲染出正确的遮罩或回退 SVG，避免再次出现圆形占位问题。
 * 关键决策与取舍：
 *  - 复用与 VoiceIcon 一致的 mock 体系，降低测试认知成本；重点断言主题分支、跨主题回退与 fallback 调用。
 * 影响范围：
 *  - 覆盖发送按钮图标的主要渲染路径，为 ChatInput 的发送体验提供回归保障。
 * 演进与TODO：
 *  - 若后续引入多尺寸或动画资源，可在此处扩展策略桩件并新增断言。
 */

let currentResolvedTheme = "light";
const mockUseTheme = jest.fn(() => ({
  resolvedTheme: currentResolvedTheme,
}));
const mockUseMaskSupport = jest.fn(() => true);

jest.unstable_mockModule("@/context", () => ({
  useTheme: mockUseTheme,
}));

jest.unstable_mockModule("../useMaskSupport.js", () => ({
  __esModule: true,
  default: mockUseMaskSupport,
  useMaskSupport: mockUseMaskSupport,
}));

const sendRegistry = {
  "send-button": {
    light: "send-light.svg",
    dark: "send-dark.svg",
  },
};

jest.unstable_mockModule("@/assets/icons.js", () => ({
  default: sendRegistry,
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
    currentResolvedTheme = "light";
    mockUseTheme.mockClear();
    mockUseMaskSupport.mockReset();
    mockUseMaskSupport.mockReturnValue(true);
  });

  afterEach(() => {
    mockUseMaskSupport.mockReset();
  });

  /**
   * 测试目标：浅色主题下应解析 light 资源并生成遮罩样式。
   * 前置条件：resolvedTheme=light，注册表提供 light/dark 资源。
   * 步骤：
   *  1) 渲染 SendIcon 并查询标记节点。
   *  2) 读取 style.mask。
   * 断言：
   *  - mask 使用 light 资源。
   * 边界/异常：
   *  - 其他主题分支由后续用例覆盖。
   */
  test("GivenLightTheme_WhenRendering_ThenApplyLightVariantMask", () => {
    const { container } = render(<SendIcon className="icon" />);

    const node = container.querySelector('[data-icon-name="send-button"]');
    expect(node).not.toBeNull();
    expect(node?.style.mask).toBe(
      "url(send-light.svg) center / contain no-repeat",
    );
  });

  /**
   * 测试目标：深色主题应解析 dark 资源，验证策略与主题联动。
   * 前置条件：resolvedTheme=dark，注册表提供 dark 资源。
   * 步骤：
   *  1) 切换主题 mock。
   *  2) 渲染组件并读取遮罩。
   * 断言：
   *  - mask 使用 dark 资源。
   * 边界/异常：
   *  - 若未来新增 single 资源，应扩充用例。
   */
  test("GivenDarkTheme_WhenRendering_ThenApplyDarkVariantMask", () => {
    currentResolvedTheme = "dark";

    const { container } = render(<SendIcon className="icon" />);

    const node = container.querySelector('[data-icon-name="send-button"]');
    expect(node).not.toBeNull();
    expect(node?.style.mask).toBe(
      "url(send-dark.svg) center / contain no-repeat",
    );
  });

  /**
   * 测试目标：当主题对应的资源缺失时，应回退到另一个可用主题资源。
   * 前置条件：删除 dark 资源，resolvedTheme=dark。
   * 步骤：
   *  1) 修改注册表后渲染组件。
   *  2) 检查遮罩是否使用 light 资源。
   * 断言：
   *  - mask 回退到 light 资源。
   * 边界/异常：
   *  - 用例结束后恢复注册表。
   */
  test("GivenMissingThemeVariant_WhenRendering_ThenFallbackToAlternateTheme", () => {
    currentResolvedTheme = "dark";
    const originalEntry = { ...sendRegistry["send-button"] };
    delete sendRegistry["send-button"].dark;

    const { container } = render(<SendIcon className="icon" />);

    const node = container.querySelector('[data-icon-name="send-button"]');
    expect(node).not.toBeNull();
    expect(node?.style.mask).toBe(
      "url(send-light.svg) center / contain no-repeat",
    );

    sendRegistry["send-button"] = originalEntry;
  });

  /**
   * 测试目标：当遮罩能力不可用时，应渲染 fallback SVG。
   * 前置条件：mockUseMaskSupport 返回 false。
   * 步骤：
   *  1) 令 hook 返回 false。
   *  2) 渲染组件并查询 SVG 元素。
   * 断言：
   *  - 渲染 fallback SVG，避免空白按钮。
   * 边界/异常：
   *  - 如未来提供渐进增强，需要同步更新断言。
   */
  test("GivenMaskUnsupported_WhenRendering_ThenRenderFallbackSvg", () => {
    mockUseMaskSupport.mockReturnValueOnce(false);

    const { container } = render(<SendIcon className="icon" />);

    expect(container.querySelector("svg")).not.toBeNull();
  });

  /**
   * 测试目标：当注册表缺失 send-button 条目时，应调用自定义 fallback。
   * 前置条件：删除整个条目，提供 mock fallback。
   * 步骤：
   *  1) 删除注册表条目后渲染组件。
   *  2) 断言 fallback 调用次数与参数。
   * 断言：
   *  - fallback 被调用一次，参数包含 className 与 iconName。
   * 边界/异常：
   *  - 渲染完成后恢复注册表，避免污染其他测试。
   */
  test("GivenMissingRegistryEntry_WhenRendering_ThenInvokeFallback", () => {
    const originalEntry = sendRegistry["send-button"];
    delete sendRegistry["send-button"];

    const fallback = jest.fn(() => null);
    render(<SendIcon className="icon" fallback={fallback} />);

    expect(fallback).toHaveBeenCalledTimes(1);
    expect(fallback).toHaveBeenCalledWith({
      className: "icon",
      iconName: "send-button",
    });

    sendRegistry["send-button"] = originalEntry;
  });
});
