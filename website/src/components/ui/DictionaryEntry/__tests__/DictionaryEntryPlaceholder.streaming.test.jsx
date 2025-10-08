import { render } from "@testing-library/react";
import DictionaryEntryPlaceholder from "@/components/ui/DictionaryEntry/DictionaryEntryPlaceholder.jsx";

const stripZeroWidth = (value) => value.replace(/\u200B/g, "");

/**
 * 测试目标：词典占位在流式预览阶段应与静态 Markdown 渲染保持一致。
 * 前置条件：传入包含两个英文单词且以空格分隔的 preview 文本。
 * 步骤：
 *  1) 渲染 DictionaryEntryPlaceholder 并提供预览字符串；
 *  2) 检查渲染结果中的段落节点；
 * 断言：
 *  - 不存在 stream-word span；
 *  - 预览文本保持原始空格与内容；
 * 边界/异常：验证无差别渲染路径。
 */
test("GivenPreview_WhenStreaming_ShouldMatchStaticMarkdown", () => {
  const { container } = render(
    <DictionaryEntryPlaceholder preview="Hello world" isLoading={false} />,
  );

  const wrapper = container.querySelector(".stream-text");
  expect(wrapper).not.toBeNull();
  const spans = wrapper.querySelectorAll("span.stream-word");
  expect(spans.length).toBe(0);
  expect(stripZeroWidth(wrapper.textContent)).toBe("Hello world");
});
