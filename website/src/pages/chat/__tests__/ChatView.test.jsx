import { render, screen, fireEvent, renderHook } from "@testing-library/react";
jest.mock("remark-gfm", () => () => {});
import ChatView from "@/pages/chat/ChatView";
import { useTranslation } from "@/context";

/**
 * 验证 ChatView 使用 MarkdownRenderer 渲染消息。
 */
test("renders streamed markdown", async () => {
  async function* streamFn() {
    yield "**bold**";
  }
  const { result } = renderHook(() => useTranslation());
  render(<ChatView streamFn={() => streamFn()} />);
  const input = screen.getByPlaceholderText(
    result.current.t("chatPlaceholder"),
  );
  fireEvent.change(input, { target: { value: "hi" } });
  fireEvent.submit(input.closest("form"));
  const strong = await screen.findByText("bold");
  expect(strong.tagName).toBe("STRONG");
});
