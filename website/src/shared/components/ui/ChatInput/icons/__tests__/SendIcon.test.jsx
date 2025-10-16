/* eslint-env jest */
import { render } from "@testing-library/react";
import { jest } from "@jest/globals";

/**
 * 背景：
 *  - SendIcon 改用静态 SVG 渲染后，需要验证 data 标识与资源引用是否保持一致。
 * 目的：
 *  - 确保发送按钮输出可继承主题色的 inline SVG，并暴露语义化属性便于样式与测试复用。
 * 关键决策与取舍：
 *  - 通过资源 mock 固定 inline 内容，聚焦结构与属性校验，避免依赖真实打包路径。
 * 影响范围：
 *  - ChatInput 发送按钮的展示层稳定性回归验证。
 * 演进与TODO：
 *  - 后续若新增多主题资源，可在此扩展对 variant props 的断言。
 */

jest.unstable_mockModule("@assets/chat-send.svg", () => ({
  __esModule: true,
  default: "send-asset.svg",
}));

jest.unstable_mockModule("@assets/chat-send.svg?raw", () => ({
  __esModule: true,
  default: '<svg data-token="send-inline"></svg>',
}));

const { default: SendIcon } = await import("../SendIcon.jsx");

describe("SendIcon", () => {
  /**
   * 测试目标：渲染发送图标时应输出带有语义标记的 inline 节点。
   * 前置条件：传入标准 className。
   * 步骤：
   *  1) 渲染组件并查询 chat-send 节点。
   *  2) 校验元素标签与关键属性。
   * 断言：
   *  - 返回 inline 节点并标记 data-render-mode=inline。
   *  - 节点输出非空 inline 内容且 aria-hidden=true，符合装饰图标要求。
   * 边界/异常：
   *  - 若未来需要可见文本，应同步调整此断言。
   */
  test("GivenClassName_WhenRendering_ThenPreferInlinePayload", () => {
    const { container } = render(<SendIcon className="icon" />);

    const node = container.querySelector('[data-icon-name="chat-send"]');

    expect(node).not.toBeNull();
    expect(node?.tagName).toBe("SPAN");
    expect(node?.getAttribute("data-render-mode")).toBe("inline");
    expect(node?.getAttribute("src")).toBeNull();
    expect(node?.innerHTML).not.toHaveLength(0);
    expect(node?.getAttribute("aria-hidden")).toBe("true");
    expect(node?.classList.contains("icon")).toBe(true);
  });
});
