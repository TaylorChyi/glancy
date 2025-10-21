import { act, fireEvent, render, screen, within } from "@testing-library/react";
import {
  MARKDOWN_RENDERING_MODE_DYNAMIC,
  MARKDOWN_RENDERING_MODE_PLAIN,
  useSettingsStore,
} from "@core/store/settings";

const stripZeroWidth = (value) => value.replace(/\u200B/g, "");
const getButtonByLabel = (label) =>
  screen.getByRole("button", {
    name: (value) => stripZeroWidth(value) === label,
  });
import MarkdownRenderer from "@shared/components/ui/MarkdownRenderer";
import styles from "@shared/components/ui/MarkdownRenderer/MarkdownRenderer.module.css";

beforeEach(() => {
  act(() => {
    const state = useSettingsStore.getState();
    useSettingsStore.setState({
      markdownRenderingMode: MARKDOWN_RENDERING_MODE_DYNAMIC,
      setMarkdownRenderingMode: state.setMarkdownRenderingMode,
    });
  });
});

/**
 * 验证 MarkdownRenderer 能解析 GFM 语法。
 */
test("renders GFM syntax", () => {
  render(<MarkdownRenderer>{"~~gone~~"}</MarkdownRenderer>);
  const del = screen.getByText((content) => stripZeroWidth(content) === "gone");
  expect(del.tagName).toBe("DEL");
});

/**
 * 测试目标：Markdown 表格在动态渲染模式下保留语义结构与列头信息。
 * 前置条件：提供包含单个表格的 Markdown，表头与数据行字段齐全。
 * 步骤：
 *  1) 渲染含表格的 Markdown 文本。
 *  2) 查询 table 节点及其列头、单元格。
 * 断言：
 *  - 仅存在一个 table 元素且列头数量为 5。
 *  - 数据行的“对应义项”列保留 emoji 义项标记（例如 1️⃣）。
 * 边界/异常：
 *  - 若缺失列或无法解析表格，则说明 GFM 表格支持回归。
 */
test("renders markdown tables with accessible structure", () => {
  const markdown = [
    "## 对比",
    "",
    "| 对比词 | 核心判别准则 | 英文例句 | 中文翻译 | 对应义项 |",
    "| --- | --- | --- | --- | --- |",
    "| adopt | choose the appropriate verb | Adopt the new policy. | 采纳这项新政策。 | 1️⃣ |",
  ].join("\n");

  render(<MarkdownRenderer>{markdown}</MarkdownRenderer>);

  const table = screen.getByRole("table");
  expect(table).toBeInTheDocument();

  const headers = within(table).getAllByRole("columnheader");
  expect(headers).toHaveLength(5);
  expect(
    headers.map((header) => stripZeroWidth(header.textContent ?? "")),
  ).toEqual([
    "对比词",
    "核心判别准则",
    "英文例句",
    "中文翻译",
    "对应义项",
  ]);
  headers.forEach((header) => {
    expect(header).toHaveClass(styles["table-header-cell"]);
  });

  const cells = within(table).getAllByRole("cell");
  expect(cells).toHaveLength(5);
  expect(stripZeroWidth(cells[4].textContent ?? "")).toBe("1️⃣");
});

test("returns null for empty content", () => {
  const { container } = render(<MarkdownRenderer>{""}</MarkdownRenderer>);
  expect(container).toBeEmptyDOMElement();
});

/**
 * 测试目标：关闭动态渲染后直接展示原始文本，不应生成 Markdown 节点。
 * 前置条件：Markdown 渲染模式设为 plain。
 * 步骤：
 *  1) 更新 store 将模式切换为 plain。
 *  2) 渲染带有 Markdown 语法的文本。
 * 断言：
 *  - 容器内不存在 <strong> 元素。
 *  - 文本原样保留星号与换行。
 * 边界/异常：
 *  - 若仍生成 Markdown DOM，则说明策略切换失效。
 */
test("renders plain text when markdown strategy disabled", () => {
  act(() => {
    useSettingsStore.setState({
      markdownRenderingMode: MARKDOWN_RENDERING_MODE_PLAIN,
    });
  });

  const markdown = "**bold**\nNext";
  const { container } = render(<MarkdownRenderer>{markdown}</MarkdownRenderer>);

  expect(container.querySelector("strong")).toBeNull();
  expect(container.textContent).toBe(markdown);
});

/**
 * 验证二级标题会收拢正文并默认展开，且交互按钮可切换状态。
 */
test("wraps second level headings into expandable sections", () => {
  const markdown = "## Overview\n\nParagraph";
  render(<MarkdownRenderer>{markdown}</MarkdownRenderer>);

  const toggle = getButtonByLabel("Overview");
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

  const parentToggle = getButtonByLabel("Parent");
  const childToggle = getButtonByLabel("Child");

  expect(parentToggle).toHaveAttribute("aria-expanded", "true");
  expect(childToggle).toHaveAttribute("aria-expanded", "false");
});

/**
 * 测试目标：英文长词标题在折叠摘要内被注入零宽断行符，避免宽度溢出。
 * 前置条件：提供无空格的英文词组作为二级标题。
 * 步骤：
 *  1) 渲染包含长词标题的 Markdown。
 *  2) 获取折叠按钮节点。
 * 断言：
 *  - 按钮名保持原始字符串。
 *  - 文本内容包含零宽空格作为断行点。
 * 边界/异常：
 *  - 长词应至少插入一个可选断点。
 */
test("injects break opportunities for long english headings", () => {
  const markdown = "## SightseeingExperienceHighlights\n\nBody";
  render(<MarkdownRenderer>{markdown}</MarkdownRenderer>);

  const toggle = screen.getByRole("button", {
    name: (value) =>
      stripZeroWidth(value) === "SightseeingExperienceHighlights",
  });
  expect(
    stripZeroWidth(toggle.getAttribute("aria-label") ?? toggle.textContent),
  ).toBe("SightseeingExperienceHighlights");
  expect(toggle.textContent).toContain("\u200B");
});

/**
 * 测试目标：多字节语言（中文）标题亦能注入零宽断行符，保持可读性。
 * 前置条件：提供含标点的中文标题。
 * 步骤：
 *  1) 渲染包含中文标题的 Markdown。
 *  2) 定位折叠按钮。
 * 断言：
 *  - 折叠按钮的辅助名称与原文一致。
 *  - 标题内部存在至少一个零宽空格。
 * 边界/异常：
 *  - 中文字符间均应具备断行能力。
 */
test("injects break opportunities for cjk headings", () => {
  const markdown = "## 单词：观光体验合集\n\n内容";
  render(<MarkdownRenderer>{markdown}</MarkdownRenderer>);

  const toggle = screen.getByRole("button", {
    name: (value) => stripZeroWidth(value) === "单词：观光体验合集",
  });
  expect(
    stripZeroWidth(toggle.getAttribute("aria-label") ?? toggle.textContent),
  ).toBe("单词：观光体验合集");
  expect(toggle.textContent).toContain("\u200B");
});

/**
 * 测试目标：注入零宽断行的同时保留原有空格，避免英文句子出现连写。
 * 前置条件：Markdown 段落包含常规空格分隔的英文文本。
 * 步骤：
 *  1) 渲染包含英文句子的 Markdown。
 *  2) 获取段落节点。
 * 断言：
 *  - 段落文本保留至少一个显式空格字符；若缺失则说明断行逻辑破坏空格。
 * 边界/异常：
 *  - 覆盖最常见的英文句子场景，防止未来回归导致可读性下降。
 */
test("keeps regular spaces intact while injecting breaks", () => {
  const markdown = "Hello world from markdown.";
  render(<MarkdownRenderer>{markdown}</MarkdownRenderer>);

  const paragraph = screen.getByText(
    (content) => stripZeroWidth(content) === markdown,
  );
  expect(paragraph.textContent).toContain(" ");
});

/**
 * 测试目标：代码块内文本不应被插入断行点，保证语法原样输出。
 * 前置条件：Markdown 含多行代码块。
 * 步骤：
 *  1) 渲染代码块 Markdown。
 *  2) 查询 `<code>` 节点。
 * 断言：
 *  - 代码节点下不存在 `<wbr>`。
 * 边界/异常：
 *  - 若解析失败，应快速定位具体代码块。
 */
test("skips break injection inside code blocks", () => {
  const markdown = "```js\nconst sightseeing = true;\n```";
  render(<MarkdownRenderer>{markdown}</MarkdownRenderer>);

  const code = screen.getByText("const sightseeing = true;");
  expect(code.textContent).not.toContain("\u200B");
});

/**
 * 测试目标：传入自定义组件时仍保留折叠摘要渲染器。
 * 前置条件：覆盖段落标签并渲染包含二级标题的 Markdown。
 * 步骤：
 *  1) 渲染 MarkdownRenderer 并通过 components 覆写段落。
 *  2) 捕获折叠按钮与自定义段落节点。
 * 断言：
 *  - DOM 中不存在原生 <collapsible-summary> 标签。
 *  - 折叠按钮可用且 aria-expanded 属性默认为 true。
 * 边界/异常：
 *  - 若折叠结构失效，应能立即定位此测试失败。
 */
test("merges custom components with collapsible summaries", () => {
  const markdown = "## Custom Heading\n\nParagraph";
  const CustomParagraph = ({ children, ...paragraphProps }) => (
    <p data-testid="custom-paragraph" {...paragraphProps}>
      {children}
    </p>
  );

  render(
    <MarkdownRenderer
      components={{
        p: CustomParagraph,
      }}
    >
      {markdown}
    </MarkdownRenderer>,
  );

  const toggle = getButtonByLabel("Custom Heading");
  expect(toggle).toHaveAttribute("aria-expanded", "true");
  expect(document.querySelector("collapsible-summary")).toBeNull();
  expect(screen.getByTestId("custom-paragraph")).toBeInTheDocument();
});
