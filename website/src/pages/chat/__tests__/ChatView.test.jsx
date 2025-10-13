import { render, screen, fireEvent, waitFor } from "@testing-library/react";
jest.mock("remark-gfm", () => () => {});
jest.mock("@/context", () => ({
  useLanguage: () => ({
    t: { chatPlaceholder: "输入消息...", sendButton: "发送" },
  }),
}));
import ChatView from "@/pages/chat/ChatView";
import {
  CHAT_COMPLETION_MODE_STREAMING,
  CHAT_COMPLETION_MODE_SYNC,
  useSettingsStore,
} from "@/store/settings";

beforeEach(() => {
  useSettingsStore.setState({
    chatCompletionMode: CHAT_COMPLETION_MODE_STREAMING,
  });
});

/**
 * 验证 ChatView 使用国际化文案并渲染 Markdown。
 */
test("renders streamed markdown with i18n texts", async () => {
  async function* streamFn() {
    yield "**bold**";
  }
  render(<ChatView streamFn={() => streamFn()} />);
  const input = screen.getByPlaceholderText("输入消息...");
  expect(screen.getByLabelText("Voice")).toBeInTheDocument();
  fireEvent.change(input, { target: { value: "hi" } });
  const sendButton = screen.getByLabelText("发送");
  fireEvent.click(sendButton);
  const strong = await screen.findByText("bold");
  expect(strong.tagName).toBe("STRONG");
});

/**
 * 验证切换同步输出时能够渲染聚合 Markdown。
 */
test("renders aggregated markdown when sync mode enabled", async () => {
  useSettingsStore.setState({ chatCompletionMode: CHAT_COMPLETION_MODE_SYNC });
  const completeFn = jest
    .fn()
    .mockResolvedValue("**final** response with _style_");
  render(<ChatView completeFn={completeFn} />);
  const input = screen.getByPlaceholderText("输入消息...");
  fireEvent.change(input, { target: { value: "hello" } });
  fireEvent.click(screen.getByLabelText("发送"));
  await waitFor(() => expect(completeFn).toHaveBeenCalledTimes(1));
  expect(completeFn).toHaveBeenCalledWith(
    expect.objectContaining({
      model: expect.any(String),
      messages: expect.any(Array),
    }),
  );
  const strong = await screen.findByText("final");
  expect(strong.tagName).toBe("STRONG");
});
