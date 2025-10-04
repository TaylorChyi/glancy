/* eslint-env jest */
import { render } from "@testing-library/react";
import { jest } from "@jest/globals";

/**
 * 背景：
 *  - VoiceIcon 现采用静态 SVG 方案，需校验语义属性是否与发送按钮保持一致。
 * 目的：
 *  - 确保语音按钮渲染出 img 元素并标记为 voice-button，避免回退逻辑残留。
 * 关键决策与取舍：
 *  - 模拟资源导入以固定 src，聚焦节点结构验证。
 * 影响范围：
 *  - ChatInput 语音态按钮视觉回归测试。
 * 演进与TODO：
 *  - 若未来语音按钮需要多状态资源，应在此扩展变体断言。
 */

jest.unstable_mockModule("@/assets/voice-button.svg", () => ({
  __esModule: true,
  default: "voice-asset.svg",
}));

const { default: VoiceIcon } = await import("../VoiceIcon.jsx");

describe("VoiceIcon", () => {
  /**
   * 测试目标：语音图标应渲染装饰性 img 元素并正确暴露 data 属性。
   * 前置条件：传入标准 className。
   * 步骤：
   *  1) 渲染组件后查询 voice-button 节点。
   *  2) 校验属性与类名。
   * 断言：
   *  - 节点为 IMG，且 src 指向模拟资源。
   *  - alt 为空并设置 aria-hidden=true。
   * 边界/异常：
   *  - 暂无额外分支，未来如增加可视文案需同步调整。
   */
  test("GivenClassName_WhenRendering_ThenExposeStaticImage", () => {
    const { container } = render(<VoiceIcon className="icon" />);

    const node = container.querySelector('img[data-icon-name="voice-button"]');

    expect(node).not.toBeNull();
    expect(node?.tagName).toBe("IMG");
    expect(node?.getAttribute("src")).toBe("voice-asset.svg");
    expect(node?.getAttribute("alt")).toBe("");
    expect(node?.getAttribute("aria-hidden")).toBe("true");
    expect(node?.classList.contains("icon")).toBe(true);
  });
});
