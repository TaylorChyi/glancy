import { render, screen } from "@testing-library/react";
import MarkdownStream from "@/components/ui/MarkdownStream";

const stripZeroWidth = (value) => value.replace(/\u200B/g, "");

/**
 * 确认 MarkdownStream 默认渲染 Markdown 字符串。
 */
test("renders markdown with default renderer", () => {
  render(<MarkdownStream text="**bold**" />);
  const strong = screen.getByText(
    (content) => stripZeroWidth(content) === "bold",
  );
  expect(strong.tagName).toBe("STRONG");
});
