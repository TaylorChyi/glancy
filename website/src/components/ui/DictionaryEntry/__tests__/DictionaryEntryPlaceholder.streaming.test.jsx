import { render } from "@testing-library/react";
import DictionaryEntryPlaceholder from "@/components/ui/DictionaryEntry/DictionaryEntryPlaceholder.jsx";

const stripZeroWidth = (value) => value.replace(/\u200B/g, "");

/**
 * 测试目标：词典占位在流式预览阶段应执行词级拆分，保留空格。
 * 前置条件：传入包含两个英文单词且以空格分隔的 preview 文本。
 * 步骤：
 *  1) 渲染 DictionaryEntryPlaceholder 并提供预览字符串；
 *  2) 选择渲染结果中的 stream-word span；
 * 断言：
 *  - span 数量等于单词数量；
 *  - 容器整体文本仍包含原始空格；
 * 边界/异常：
 *  - 断言失败信息需指明词语拆分不符合预期。
 */
test("GivenPreview_WhenStreaming_ShouldSplitWordsWithoutLosingSpaces", () => {
  const { container } = render(
    <DictionaryEntryPlaceholder preview="Hello world" isLoading={false} />,
  );

  const wrapper = container.querySelector(".stream-text");
  expect(wrapper).not.toBeNull();
  const spans = wrapper.querySelectorAll("span.stream-word");
  expect(spans.length).toBe(2);
  expect(stripZeroWidth(spans[0].textContent)).toBe("Hello");
  expect(stripZeroWidth(spans[1].textContent)).toBe("world");
  expect(stripZeroWidth(wrapper.textContent)).toBe("Hello world");
});
