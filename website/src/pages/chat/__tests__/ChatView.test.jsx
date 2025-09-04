import { render, screen, fireEvent } from "@testing-library/react";
jest.mock("remark-gfm", () => () => {});
jest.mock("@/context", () => ({
  useLanguage: () => ({
    t: { chatPlaceholder: "输入消息...", sendButton: "发送" },
  }),
}));
import ChatView from "@/pages/chat/ChatView";

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
