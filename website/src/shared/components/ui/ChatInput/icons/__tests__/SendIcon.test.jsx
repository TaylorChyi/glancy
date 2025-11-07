/* eslint-env jest */
import { render } from "@testing-library/react";
import { jest } from "@jest/globals";



jest.unstable_mockModule("@assets/interface/controls/send-button.svg", () => ({
  __esModule: true,
  default: "send-asset.svg",
}));

jest.unstable_mockModule(
  "@assets/interface/controls/send-button.svg?raw",
  () => ({
    __esModule: true,
    default: '<svg data-token="send-inline"></svg>',
  }),
);

const { default: SendIcon } = await import("../SendIcon.jsx");

describe("SendIcon", () => {
  /**
   * 测试目标：渲染发送图标时应输出带有语义标记的 inline 节点。
   * 前置条件：传入标准 className。
   * 步骤：
   *  1) 渲染组件并查询 data-icon 节点。
   *  2) 校验元素标签与关键属性。
   * 断言：
   *  - 返回 inline 节点并标记 data-render-mode=inline。
   *  - 节点输出非空 inline 内容且 aria-hidden=true，符合装饰图标要求。
   * 边界/异常：
   *  - 若未来需要可见文本，应同步调整此断言。
   */
  test("GivenClassName_WhenRendering_ThenPreferInlinePayload", () => {
    const { container } = render(<SendIcon className="icon" />);

    const node = container.querySelector('[data-icon-name="send-button"]');

    expect(node).not.toBeNull();
    expect(node?.tagName).toBe("SPAN");
    expect(node?.getAttribute("data-render-mode")).toBe("inline");
    expect(node?.getAttribute("src")).toBeNull();
    expect(node?.innerHTML).not.toHaveLength(0);
    expect(node?.getAttribute("aria-hidden")).toBe("true");
    expect(node?.classList.contains("icon")).toBe(true);
  });
});
