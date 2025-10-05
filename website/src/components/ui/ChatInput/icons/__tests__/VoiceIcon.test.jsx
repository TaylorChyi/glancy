/* eslint-env jest */
import { render } from "@testing-library/react";
import { jest } from "@jest/globals";

/**
 * 背景：
 *  - VoiceIcon 现采用静态 SVG 方案，需校验语义属性是否与发送按钮保持一致。
 * 目的：
 *  - 确保语音按钮渲染出可继承主题色的 inline SVG，并标记为 voice-button，避免回退逻辑残留。
 * 关键决策与取舍：
 *  - 模拟资源导入以固定 inline 内容，聚焦节点结构验证。
 * 影响范围：
 *  - ChatInput 语音态按钮视觉回归测试。
 * 演进与TODO：
 *  - 若未来语音按钮需要多状态资源，应在此扩展变体断言。
 */

jest.unstable_mockModule("@/assets/voice-button.svg", () => ({
  __esModule: true,
  default: "voice-asset.svg",
}));

jest.unstable_mockModule("@/assets/voice-button.svg?raw", () => ({
  __esModule: true,
  default: "<svg data-token=\"voice-inline\"></svg>",
}));

const { default: VoiceIcon } = await import("../VoiceIcon.jsx");

describe("VoiceIcon", () => {
  /**
   * 测试目标：语音图标应渲染装饰性 inline 节点并正确暴露 data 属性。
   * 前置条件：传入标准 className。
   * 步骤：
   *  1) 渲染组件后查询 voice-button 节点。
   *  2) 校验属性与类名。
   * 断言：
   *  - 节点为 inline 容器且标记 data-render-mode=inline。
   *  - 节点输出非空 inline 内容并设置 aria-hidden=true。
   * 边界/异常：
   *  - 暂无额外分支，未来如增加可视文案需同步调整。
   */
  test("GivenClassName_WhenRendering_ThenPreferInlinePayload", () => {
    const { container } = render(<VoiceIcon className="icon" />);

    const node = container.querySelector('[data-icon-name="voice-button"]');

    expect(node).not.toBeNull();
    expect(node?.tagName).toBe("SPAN");
    expect(node?.getAttribute("data-render-mode")).toBe("inline");
    expect(node?.getAttribute("src")).toBeNull();
    expect(node?.innerHTML).not.toHaveLength(0);
    expect(node?.getAttribute("aria-hidden")).toBe("true");
    expect(node?.classList.contains("icon")).toBe(true);
  });
});
