/* eslint-env jest */
import { render } from "@testing-library/react";
import { jest } from "@jest/globals";

/**
 * 背景：
 *  - VoiceIcon 需根据主题动态切换遮罩资源，过去使用模块级常量导致主题切换后样式无法更新。
 * 目的：
 *  - 通过对 useTheme 与图标注册表的桩件，验证在不同主题下能解析正确的遮罩，并在缺失资源时触发降级渲染。
 * 关键决策与取舍：
 *  - 采用策略模式：通过 mockUseTheme 控制 resolvedTheme 以驱动遮罩选择，同时模拟图标注册表确保不依赖真实资源路径。
 *  - 舍弃直接引用真实 SVG，避免 Jest 文件桩导致的同值干扰，确保断言具备区分度。
 * 影响范围：
 *  - 覆盖 VoiceIcon 主题分支与兜底逻辑，间接保障 ChatInput 动作按钮图标渲染稳定。
 * 演进与TODO：
 *  - 后续若新增高对比主题，应扩充此处的注册表桩件与断言以覆盖新增变体。
 */

let currentResolvedTheme = "light";
const mockUseTheme = jest.fn(() => ({
  resolvedTheme: currentResolvedTheme,
}));

jest.unstable_mockModule("@/context/ThemeContext", () => ({
  useTheme: mockUseTheme,
}));

const voiceRegistry = {
  "voice-button": {
    light: { src: "voice-light.svg", content: "<svg>light</svg>" },
    dark: { src: "voice-dark.svg", content: "<svg>dark</svg>" },
    single: { src: "voice-single.svg", content: "<svg>single</svg>" },
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
    global.CSS.supports.mockReturnValue(true);
    if (typeof window !== "undefined") {
      window.CSS.supports.mockReturnValue(true);
    }
  });

  /**
   * 测试目标：在浅色主题下应选择 light 变体并生成匹配的遮罩样式。
   * 前置条件：resolvedTheme=light，注册表包含 light/dark/single 资源。
   * 步骤：
   *  1) 渲染 VoiceIcon 并获取标记为 voice-button 的节点。
   *  2) 读取其 style.mask 属性。
   * 断言：
   *  - mask 属性采用 light 资源并保持模板语法。
   * 边界/异常：
   *  - 若注册表缺失或主题不匹配，应由其他用例覆盖。
   */
  test("GivenLightTheme_WhenRendering_ThenApplyLightVariantMask", () => {
    const { container } = render(<VoiceIcon className="icon" />);

    const node = container.querySelector('[data-icon-name="voice-button"]');
    expect(node).not.toBeNull();
    expect(node?.style.mask).toBe(
      "url(voice-light.svg) center / contain no-repeat",
    );
  });

  /**
   * 测试目标：在深色主题下应回退到 dark 变体，证明策略依赖 resolvedTheme 生效。
   * 前置条件：resolvedTheme=dark，注册表与默认一致。
   * 步骤：
   *  1) 切换 mock 的主题值并重新渲染组件。
   *  2) 检查标记节点的 mask 属性。
   * 断言：
   *  - mask 使用 dark 资源。
   * 边界/异常：
   *  - 若未来新增高对比主题，应扩展断言覆盖。
   */
  test("GivenDarkTheme_WhenRendering_ThenApplyDarkVariantMask", () => {
    currentResolvedTheme = "dark";

    const { container } = render(<VoiceIcon className="icon" />);

    const node = container.querySelector('[data-icon-name="voice-button"]');
    expect(node).not.toBeNull();
    expect(node?.style.mask).toBe(
      "url(voice-dark.svg) center / contain no-repeat",
    );
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
   * 测试目标：当浏览器缺乏 CSS mask 支持时，应直接渲染 fallback SVG，避免空白按钮。
   * 前置条件：CSS.supports 恒为 false，注册表仍提供资源。
   * 步骤：
   *  1) 将 CSS.supports mock 为 false。
   *  2) 渲染 VoiceIcon 并查询 SVG。
   * 断言：
   *  - 组件渲染 fallback SVG 元素。
   * 边界/异常：
   *  - 若未来引入渐进增强策略，此用例需同步调整断言。
   */
  test("GivenMaskUnsupported_WhenRendering_ThenRenderFallbackSvg", () => {
    global.CSS.supports.mockReturnValue(false);
    if (typeof window !== "undefined") {
      window.CSS.supports.mockReturnValue(false);
    }

    const { container } = render(<VoiceIcon className="icon" />);

    expect(container.querySelector("svg")).not.toBeNull();
  });
});

