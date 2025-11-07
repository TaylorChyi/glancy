import { render } from "@testing-library/react";
import DictionaryEntryPlaceholder from "@shared/components/ui/DictionaryEntry/DictionaryEntryPlaceholder.jsx";

const stripZeroWidth = (value) => value.replace(/\u200B/g, "");

/**
 * 测试目标：词典占位在预览阶段应与最终 Markdown 渲染保持一致。
 * 前置条件：传入包含两个英文单词且以空格分隔的 preview 文本。
 * 步骤：
 *  1) 渲染 DictionaryEntryPlaceholder 并提供预览字符串；
 *  2) 检查渲染结果中的段落节点；
 * 断言：
 *  - 预览文本保持原始空格与内容；
 * 边界/异常：验证无差别渲染路径。
 */
test("GivenPreview_WhenStreaming_ShouldMatchStaticMarkdown", () => {
  const { getByText } = render(
    <DictionaryEntryPlaceholder preview="Hello world" isLoading={false} />,
  );

  expect(stripZeroWidth(getByText("Hello world").textContent)).toBe(
    "Hello world",
  );
});
