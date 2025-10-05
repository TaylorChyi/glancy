import { render } from "@testing-library/react";
import { jest } from "@jest/globals";

const mockActionInput = jest.fn(() => <div data-testid="searchbar" />);

jest.unstable_mockModule("../ChatInput.module.css", () => ({
  default: {},
}));

jest.unstable_mockModule("../ActionInput", () => ({
  default: mockActionInput,
}));

jest.unstable_mockModule("../parts", () => ({
  ActionButton: () => null,
}));

jest.unstable_mockModule("@/utils/markdown.js", () => ({}));
jest.unstable_mockModule("@/utils/language.js", () => ({}));

let ChatInput;

beforeAll(async () => {
  ({ default: ChatInput } = await import("../index.jsx"));
});

afterEach(() => {
  mockActionInput.mockClear();
});

/**
 * 测试目标：自定义 maxWidth 时应向壳层注入 CSS 变量以放宽 SearchBox 宽度。
 * 前置条件：渲染 ChatInput，提供最小交互 Props 并设置 maxWidth=960。
 * 步骤：
 *  1) 渲染组件后获取容器与 SearchBox 节点。
 *  2) 读取容器 style 中的相关 CSS 自定义属性。
 * 断言：
 *  - --chat-input-shell-max === 960px。
 *  - --chat-input-shell-width === min(100%, 960px)。
 * 边界/异常：
 *  - 若变量缺失则说明宽度拓展未生效，应提醒布局层补充配置。
 */
test("GivenCustomMaxWidth_WhenRenderingChatInput_ThenExposeShellVariables", () => {
  const { container, getByTestId } = render(
    <ChatInput
      maxWidth={960}
      value="hello"
      onChange={() => {}}
      onSubmit={jest.fn()}
      onVoice={jest.fn()}
    />,
  );

  const shell = container.firstElementChild;
  expect(shell).not.toBeNull();

  const searchBox = getByTestId("searchbar");
  expect(searchBox).not.toBeNull();

  expect(shell?.style.getPropertyValue("--chat-input-shell-max")).toBe("960px");
  expect(shell?.style.getPropertyValue("--chat-input-shell-width")).toBe(
    "min(100%, 960px)",
  );
});
