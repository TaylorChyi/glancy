import { fireEvent, render, screen } from "@testing-library/react";
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

/**
 * 验证二级标题会收拢正文并默认展开，且交互按钮可切换状态。
 */
test("wraps second level headings into expandable sections", () => {
  const markdown = "## Overview\n\nParagraph";
  render(<MarkdownRenderer>{markdown}</MarkdownRenderer>);

  const toggle = screen.getByRole("button", { name: "Overview" });
  expect(toggle).toHaveAttribute("aria-expanded", "true");

  fireEvent.click(toggle);
  expect(toggle).toHaveAttribute("aria-expanded", "false");
});

/**
 * 验证三级标题默认折叠，并保持层级嵌套的正确性。
 */
test("nests collapsible sections for deeper headings", () => {
  const markdown = "## Parent\n\n### Child\n\nDetail";
  render(<MarkdownRenderer>{markdown}</MarkdownRenderer>);

  const parentToggle = screen.getByRole("button", { name: "Parent" });
  const childToggle = screen.getByRole("button", { name: "Child" });

  expect(parentToggle).toHaveAttribute("aria-expanded", "true");
  expect(childToggle).toHaveAttribute("aria-expanded", "false");
});
