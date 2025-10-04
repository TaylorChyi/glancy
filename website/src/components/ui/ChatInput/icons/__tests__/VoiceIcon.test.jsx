/* eslint-env jest */
import { render } from "@testing-library/react";
import { jest } from "@jest/globals";

/**
 * 背景：
 *  - VoiceIcon 通过 createMaskedIconRenderer 共享遮罩模板，需要验证策略函数在不同主题与降级场景下仍然生效。
 * 目的：
 *  - 通过桩件控制主题、遮罩能力与图标注册表，确保新模板对语音图标的渲染路径完整覆盖。
 * 关键决策与取舍：
 *  - 延续策略模式测试：mock useTheme、useMaskSupport 与 icon registry，聚焦资源解析与降级行为；避免依赖真实资源文件导致测试脆弱。
 * 影响范围：
 *  - 覆盖 VoiceIcon 的主题分支、遮罩降级与 fallback 调用逻辑，间接验证 createMaskedIconRenderer 的稳定性。
 * 演进与TODO：
 *  - 若未来引入录音态动画，应扩展测试验证 buildStyle 返回的额外样式字段。
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

const voiceRegistry = {
  "voice-button": {
    single: "voice.svg",
  },
};

jest.unstable_mockModule("@/assets/icons.js", () => ({
  default: voiceRegistry,
}));

const { default: VoiceIcon } = await import("../VoiceIcon.jsx");

describe("VoiceIcon", () => {
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
   * 测试目标：在浅色主题下应选择单一变体并生成匹配的遮罩样式。
   * 前置条件：resolvedTheme=light，注册表仅包含 single 资源。
   * 步骤：
   *  1) 渲染 VoiceIcon 并获取标记为 voice-button 的节点。
   *  2) 读取其 style.mask 属性。
   * 断言：
   *  - mask 属性采用 single 资源并保持模板语法。
   * 边界/异常：
   *  - 主题切换由后续用例验证。
   */
  test("GivenLightTheme_WhenRendering_ThenApplySingleVariantMask", () => {
    const { container } = render(<VoiceIcon className="icon" />);

    const node = container.querySelector('[data-icon-name="voice-button"]');
    expect(node).not.toBeNull();
    expect(node?.style.mask).toBe("url(voice.svg) center / contain no-repeat");
  });

  /**
   * 测试目标：在深色主题下亦应使用 single 资源，验证主题分支不会导致空白。
   * 前置条件：resolvedTheme=dark，注册表与默认一致。
   * 步骤：
   *  1) 切换 mock 的主题值并重新渲染组件。
   *  2) 检查标记节点的 mask 属性。
   * 断言：
   *  - mask 使用 single 资源。
   * 边界/异常：
   *  - 若未来新增高对比主题，应扩展断言覆盖。
   */
  test("GivenDarkTheme_WhenRendering_ThenFallbackToSingleVariant", () => {
    currentResolvedTheme = "dark";

    const { container } = render(<VoiceIcon className="icon" />);

    const node = container.querySelector('[data-icon-name="voice-button"]');
    expect(node).not.toBeNull();
    expect(node?.style.mask).toBe("url(voice.svg) center / contain no-repeat");
  });

  /**
   * 测试目标：当 single 资源缺失但存在主题特定资源时，仍能按 resolvedTheme 选择素材。
   * 前置条件：临时替换注册表，仅保留 dark 资源，resolvedTheme=dark。
   * 步骤：
   *  1) 调整注册表后渲染组件。
   *  2) 断言遮罩引用 dark 资源。
   * 断言：
   *  - mask 使用 dark 资源。
   * 边界/异常：
   *  - 用例结束后恢复注册表。
   */
  test("GivenOnlyThemeVariant_WhenRendering_ThenUseThemeSpecificResource", () => {
    currentResolvedTheme = "dark";
    const originalEntry = { ...voiceRegistry["voice-button"] };
    voiceRegistry["voice-button"] = { dark: "voice-dark.svg" };

    const { container } = render(<VoiceIcon className="icon" />);

    const node = container.querySelector('[data-icon-name="voice-button"]');
    expect(node).not.toBeNull();
    expect(node?.style.mask).toBe(
      "url(voice-dark.svg) center / contain no-repeat",
    );

    voiceRegistry["voice-button"] = originalEntry;
  });

  /**
   * 测试目标：当注册表缺失目标资源时，应触发 fallback，保障降级体验。
   * 前置条件：临时移除 voice-button 注册项。
   * 步骤：
   *  1) 删除注册表条目并渲染组件，注入自定义 fallback。
   *  2) 观察 fallback 是否以预期参数被调用。
   * 断言：
   *  - fallback 至少调用一次，参数包含 className 与 iconName。
   * 边界/异常：
   *  - 用例结束后恢复注册表，避免污染后续测试。
   */
  test("GivenMissingRegistry_WhenRendering_ThenInvokeFallback", () => {
    const originalEntry = voiceRegistry["voice-button"];
    delete voiceRegistry["voice-button"];

    const fallback = jest.fn(() => null);
    render(<VoiceIcon className="icon" fallback={fallback} />);

    expect(fallback).toHaveBeenCalledTimes(1);
    expect(fallback).toHaveBeenCalledWith({
      className: "icon",
      iconName: "voice-button",
    });

    voiceRegistry["voice-button"] = originalEntry;
  });

  /**
   * 测试目标：当 useMaskSupport 返回 false 时，应直接渲染 fallback SVG，避免空白按钮。
   * 前置条件：mockUseMaskSupport 返回 false，注册表仍提供资源。
   * 步骤：
   *  1) 将 mockUseMaskSupport mock 为 false。
   *  2) 渲染 VoiceIcon 并查询 SVG。
   * 断言：
   *  - 组件渲染 fallback SVG 元素。
   * 边界/异常：
   *  - 若未来引入渐进增强策略，此用例需同步调整断言。
   */
  test("GivenMaskHookDisabled_WhenRendering_ThenRenderFallbackSvg", () => {
    mockUseMaskSupport.mockReturnValueOnce(false);

    const { container } = render(<VoiceIcon className="icon" />);

    expect(container.querySelector("svg")).not.toBeNull();
  });
});
