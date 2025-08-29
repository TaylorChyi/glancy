import { render, screen } from "@testing-library/react";
jest.mock("remark-gfm", () => () => {});
import MarkdownRenderer from "@/components/ui/MarkdownRenderer";

/**
 * 验证 MarkdownRenderer 能解析 GFM 语法。
 */
test("renders GFM syntax", () => {
  render(<MarkdownRenderer>{"~~gone~~"}</MarkdownRenderer>);
  const del = screen.getByText("gone");
  expect(del.tagName).toBe("DEL");
});

test("returns null for empty content", () => {
  const { container } = render(<MarkdownRenderer>{""}</MarkdownRenderer>);
  expect(container).toBeEmptyDOMElement();
});
