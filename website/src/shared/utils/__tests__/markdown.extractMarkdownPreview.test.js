/**
 * 背景：
 *  - 历史上 markdown.test.js 聚合了预览解析与排版修饰的所有回归用例，体量已超出结构化 lint 阈值。
 * 目的：
 *  - 将 extractMarkdownPreview 相关测试拆分至独立文件，降低单文件复杂度并保障行为语义更聚焦。
 * 关键决策与取舍：
 *  - 选择以职责拆分而非简单删减测试，确保回归面完整；
 *  - 通过集中导入公共实现，保持与生产逻辑的一致性且便于后续扩展更多解析场景。
 * 影响范围：
 *  - 仅调整测试文件组织结构，不影响运行时代码；
 *  - Jest 依旧按文件名后缀自动收敛到该测试套件。
 * 演进与TODO：
 *  - 若未来扩展新的预览解析模式，应优先在此文件补充对应案例，避免回退到大一统测试文件。
 */
import { extractMarkdownPreview } from "../markdown.js";

/**
 * 测试目标：验证纯 Markdown 文本在提取预览时仅归一化换行，保持其余内容不变。
 * 前置条件：传入包含 Windows 换行的简单 Markdown 字符串。
 * 步骤：
 *  1) 调用 extractMarkdownPreview 处理原始文本。
 * 断言：
 *  - 结果中的换行符被统一为 \n，其余内容完全一致；若失败说明换行归一化逻辑被破坏。
 * 边界/异常：
 *  - 覆盖无 JSON 包装的最小输入，确保基础路径稳健。
 */
test("returns plain markdown as-is", () => {
  const result = extractMarkdownPreview("# Title\r\nLine");
  expect(result).toBe("# Title\nLine");
});

/**
 * 测试目标：校验传入完整 JSON 串时能正确提取 markdown 字段。
 * 前置条件：构造包含 term 与 markdown 字段的 JSON 字符串。
 * 步骤：
 *  1) 调用 extractMarkdownPreview 解析 JSON 串。
 * 断言：
 *  - 返回值等于 markdown 字段内容；若失败说明 JSON 解析或字段读取异常。
 * 边界/异常：
 *  - 覆盖最常见的后端响应结构。
 */
test("extracts markdown from complete json", () => {
  const json = JSON.stringify({ term: "foo", markdown: "**bold**" });
  const result = extractMarkdownPreview(json);
  expect(result).toBe("**bold**");
});

/**
 * 测试目标：确保在流式 JSON 的场景下也能提取到已出现的 markdown 片段。
 * 前置条件：输入值为尚未闭合的 JSON 片段，仅包含 markdown 字段的部分内容。
 * 步骤：
 *  1) 调用 extractMarkdownPreview 解析半截 JSON。
 * 断言：
 *  - 函数返回已解析到的 markdown 文本；若失败说明流式解析被破坏。
 * 边界/异常：
 *  - 覆盖 SSE/流式响应中常见的不完整片段。
 */
test("parses partial markdown from json stream", () => {
  const chunk = '{"markdown":"# Tit';
  const result = extractMarkdownPreview(chunk);
  expect(result).toBe("# Tit");
});

/**
 * 测试目标：验证 JSON 中的转义字符（如换行、引号）能被正确解码。
 * 前置条件：构造 markdown 字段包含换行与引号的 JSON。
 * 步骤：
 *  1) 执行 extractMarkdownPreview；
 *  2) 对比返回值。
 * 断言：
 *  - 输出中的转义序列被正确还原；若失败说明 JSON 解析逻辑存在缺陷。
 * 边界/异常：
 *  - 覆盖常见转义符号，确保渲染前后保持一致。
 */
test("decodes escaped characters", () => {
  const json = JSON.stringify({ markdown: 'Line 1\n\nHe said: "hi"' });
  const result = extractMarkdownPreview(json);
  expect(result).toBe('Line 1\n\nHe said: "hi"');
});

/**
 * 测试目标：当 JSON 中尚未出现 markdown 字段时返回 null，以便调用方沿用旧值。
 * 前置条件：输入为缺少 markdown 字段的部分 JSON 片段。
 * 步骤：
 *  1) 调用 extractMarkdownPreview 解析片段。
 * 断言：
 *  - 返回 null；若失败说明流式累积逻辑不再区分缺失字段。
 * 边界/异常：
 *  - 覆盖初次流入尚未带 markdown 字段的场景。
 */
test("returns null when markdown key missing", () => {
  const json = '{"term":"foo"';
  const result = extractMarkdownPreview(json);
  expect(result).toBeNull();
});

/**
 * 测试目标：显式的 null markdown 应被视为“已响应但内容为空”，返回空字符串以简化调用方处理。
 * 前置条件：JSON 中 markdown 字段值为 null。
 * 步骤：
 *  1) 调用 extractMarkdownPreview。
 * 断言：
 *  - 返回空字符串；若失败则说明空值分支处理异常。
 * 边界/异常：
 *  - 覆盖服务端使用 null 表示缺省内容的场景。
 */
test("treats null markdown as empty string", () => {
  const json = '{"markdown":null}';
  const result = extractMarkdownPreview(json);
  expect(result).toBe("");
});
