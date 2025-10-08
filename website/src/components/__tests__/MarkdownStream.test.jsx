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
 * 测试目标：默认分段策略应与静态 Markdown 一致，不插入额外 span。
 * 前置条件：输入文本包含以空格分隔的英文单词。
 * 步骤：
 *  1) 渲染 MarkdownStream 并传入 "Hello world"；
 *  2) 查询生成的段落元素；
 * 断言：
 *  - 不存在 stream-word span；
 *  - 段落文本保持原始空格。
 * 边界/异常：覆盖默认策略路径。
 */
test("omits segmentation spans by default", () => {
  const { container } = render(<MarkdownStream text="Hello world" />);
  const paragraph = container.querySelector(".stream-text p");
  expect(paragraph).not.toBeNull();
  const spans = paragraph.querySelectorAll("span.stream-word");
  expect(spans).toHaveLength(0);
  expect(stripZeroWidth(paragraph.textContent)).toBe("Hello world");
});

/**
 * 测试目标：显式请求词级分段时应输出 stream-word span，保持空格。
 * 前置条件：segmentation 属性传入 "word"。
 * 步骤：
 *  1) 渲染 MarkdownStream 并传入 segmentation="word"；
 *  2) 查询 stream-word span；
 * 断言：
 *  - span 数量等于单词数量且文本保持原值；
 * 边界/异常：验证策略切换能力。
 */
test("applies word segmentation when requested", () => {
  const { container } = render(
    <MarkdownStream text="Hello world" segmentation="word" />,
  );
  const paragraph = container.querySelector(".stream-text p");
  expect(paragraph).not.toBeNull();
  const spans = paragraph.querySelectorAll("span.stream-word");
  expect(spans).toHaveLength(2);
  expect(stripZeroWidth(spans[0].textContent)).toBe("Hello");
  expect(stripZeroWidth(spans[1].textContent)).toBe("world");
  expect(stripZeroWidth(paragraph.textContent)).toBe("Hello world");
});
