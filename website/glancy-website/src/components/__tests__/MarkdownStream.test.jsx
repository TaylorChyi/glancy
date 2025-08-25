import { render, screen } from "@testing-library/react";
jest.mock("remark-gfm", () => () => {});
import MarkdownStream from "@/components/ui/MarkdownStream";

/**
 * 确认 MarkdownStream 默认渲染 Markdown 字符串。
 */
test("renders markdown with default renderer", () => {
  render(<MarkdownStream text="**bold**" />);
  const strong = screen.getByText("bold");
  expect(strong.tagName).toBe("STRONG");
});
