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

/**
 * 测试目标：验证流式 Markdown 在渲染时按空格拆分词语。
 * 前置条件：输入文本包含以空格分隔的英文单词。
 * 步骤：
 *  1) 渲染 MarkdownStream 并传入 "Hello world"；
 *  2) 查询生成的词级 span 元素；
 * 断言：
 *  - span 数量等于单词数量且文本保持原始值；
 * 边界/异常：
 *  - 确保未破坏空格本身（通过比较父节点文本）。
 */
test("splits words with dedicated spans during streaming", () => {
  const { container } = render(<MarkdownStream text="Hello world" />);
  const paragraph = container.querySelector(".stream-text p");
  expect(paragraph).not.toBeNull();
  const spans = paragraph.querySelectorAll("span.stream-word");
  expect(spans).toHaveLength(2);
  expect(stripZeroWidth(spans[0].textContent)).toBe("Hello");
  expect(stripZeroWidth(spans[1].textContent)).toBe("world");
  expect(stripZeroWidth(paragraph.textContent)).toBe("Hello world");
});
