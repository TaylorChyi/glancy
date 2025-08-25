import { render, screen } from "@testing-library/react";
import ReactMarkdown from "react-markdown";
import MarkdownStream from "@/components/ui/MarkdownStream";

/**
 * 确认 MarkdownStream 使用 renderer 属性正确渲染 Markdown 字符串。
 */
test("renders markdown via injected renderer", () => {
  render(<MarkdownStream text="**bold**" renderer={ReactMarkdown} />);
  const strong = screen.getByText("bold");
  expect(strong.tagName).toBe("STRONG");
});
