import {
  extractMarkdownPreview,
  polishDictionaryMarkdown,
} from "./markdown.js";

/**
 * 验证纯 Markdown 文本会被原样返回（仅规范化换行）。
 */
test("returns plain markdown as-is", () => {
  const result = extractMarkdownPreview("# Title\r\nLine");
  expect(result).toBe("# Title\nLine");
});

/**
 * 验证完整 JSON 结构能正确提取 markdown 字段。
 */
test("extracts markdown from complete json", () => {
  const json = JSON.stringify({ term: "foo", markdown: "**bold**" });
  const result = extractMarkdownPreview(json);
  expect(result).toBe("**bold**");
});

/**
 * 验证流式 JSON 时能够解析部分 markdown 内容。
 */
test("parses partial markdown from json stream", () => {
  const chunk = '{"markdown":"# Tit';
  const result = extractMarkdownPreview(chunk);
  expect(result).toBe("# Tit");
});

/**
 * 验证 markdown 中的转义字符能够正确解码。
 */
test("decodes escaped characters", () => {
  const json = JSON.stringify({ markdown: 'Line 1\n\nHe said: "hi"' });
  const result = extractMarkdownPreview(json);
  expect(result).toBe('Line 1\n\nHe said: "hi"');
});

/**
 * 验证当 JSON 中尚未出现 markdown 字段时返回 null 以便沿用旧值。
 */
test("returns null when markdown key missing", () => {
  const json = '{"term":"foo"';
  const result = extractMarkdownPreview(json);
  expect(result).toBeNull();
});

/**
 * 验证 markdown 显式为 null 时返回空字符串。
 */
test("treats null markdown as empty string", () => {
  const json = '{"markdown":null}';
  const result = extractMarkdownPreview(json);
  expect(result).toBe("");
});

/**
 * 验证 `polishDictionaryMarkdown` 会强制将译文放到独立行，避免与英文例句同行展示。
 */
test("polishDictionaryMarkdown enforces translation line break", () => {
  const source = "- **例句 1**: Hello world  **翻译**: 你好世界";
  const result = polishDictionaryMarkdown(source);
  expect(result).toBe("- **例句 1**: Hello world\n  **翻译**: 你好世界");
});

/**
 * 验证英译英 Markdown 中的行内标签（如 Example）也会断行，保证可读性。
 */
test("polishDictionaryMarkdown splits english inline labels", () => {
  const source = "- **Meaning**: to light  **Example**: She lights a candle";
  const result = polishDictionaryMarkdown(source);
  expect(result).toBe(
    "- **Meaning**: to light\n  **Example**: She lights a candle",
  );
});

/**
 * 测试目标：验证英译英标签在只有单个空格分隔时也能断行，避免释义与例句连在一起。
 * 前置条件：使用 markdown 行内展示的例句与释义，且分隔符仅包含单个空格。
 * 步骤：
 *  1) 构造仅含单个空格的行内标签 markdown。
 *  2) 调用 polishDictionaryMarkdown 进行格式化。
 * 断言：
 *  - 例句标签会换行并继承列表缩进，若失败则表示正则未覆盖精简空格场景。
 * 边界/异常：
 *  - 此用例覆盖最紧凑的空格场景，可防止未来格式化逻辑回退。
 */
test("polishDictionaryMarkdown splits labels separated by single space", () => {
  const source = "- **Meaning**: to light **Example**: She lights a candle";
  const result = polishDictionaryMarkdown(source);
  expect(result).toBe(
    "- **Meaning**: to light\n  **Example**: She lights a candle",
  );
});

/**
 * 验证组合标签（如 Pronunciation-British 或 AudioNotes）在英译英场景中也会断行，保持缩进对齐。
 */
test("polishDictionaryMarkdown splits composite english inline labels", () => {
  const source =
    "- **Pronunciation-British**: /ˈhjuː.mən/  **AudioNotes**: authoritative archival";
  const result = polishDictionaryMarkdown(source);
  expect(result).toBe(
    "- **Pronunciation-British**: /ˈhjuː.mən/\n  **AudioNotes**: authoritative archival",
  );
});

/**
 * 验证翻译行会继承有序列表的缩进，使得“翻译”与“例句”保持列对齐。
 */
test("translation line keeps ordered list indentation", () => {
  const source = "1. **例句**: Sample text  **翻译**: 示例文本";
  const result = polishDictionaryMarkdown(source);
  expect(result).toBe("1. **例句**: Sample text\n   **翻译**: 示例文本");
});

/**
 * 验证翻译行会继承嵌套无序列表的缩进，避免视觉错位。
 */
test("translation line keeps nested unordered list indentation", () => {
  const source = "  - **例句**: Nested sample  **翻译**: 嵌套示例";
  const result = polishDictionaryMarkdown(source);
  expect(result).toBe("  - **例句**: Nested sample\n    **翻译**: 嵌套示例");
});

/**
 * 测试目标：验证串联的英译英标签会被拆行并恢复空格，提升词条可读性。
 * 前置条件：行内包含 `Examples:Example1:...`、`UsageInsight:...` 等紧贴字段。
 * 步骤：
 *  1) 构造含多个紧贴字段的字典 Markdown 文本。
 *  2) 调用 polishDictionaryMarkdown 进行格式化。
 * 断言：
 *  - 每个字段单独换行，标签被加粗且冒号后带空格，若失败则表示新解析逻辑未生效。
 * 边界/异常：
 *  - 覆盖多字段连缀场景，可防止未来回归导致再次合并成单行。
 */
test("polishDictionaryMarkdown expands collapsed dictionary metadata", () => {
  const source = [
    "Examples:Example1:The train came at exactly 3:15 PM as scheduled.",
    "UsageInsight:Often used when describing precise arrivals.",
    "Register:Formal",
    "EntryType:SingleWord",
  ].join("\n");
  const result = polishDictionaryMarkdown(source);
  expect(result).toBe(
    [
      "**Examples**:",
      "**Example 1**: The train came at exactly 3:15 PM as scheduled.",
      "**Usage Insight**: Often used when describing precise arrivals.",
      "**Register**: Formal",
      "**Entry Type**: Single Word",
    ].join("\n"),
  );
});

/**
 * 测试目标：确保冒号补空格逻辑不会破坏 URL 语法。
 * 前置条件：输入文本包含 `http://` 链接。
 * 步骤：
 *  1) 传入带 URL 的字符串。
 *  2) 调用 polishDictionaryMarkdown。
 * 断言：
 *  - 输出与原始字符串一致，若失败说明误处理了协议前缀。
 * 边界/异常：
 *  - 涵盖最常见的协议格式，可避免未来修改误伤链接。
 */
test("polishDictionaryMarkdown preserves url colon usage", () => {
  const source = "See http://example.com for details";
  const result = polishDictionaryMarkdown(source);
  expect(result).toBe(source);
});

/**
 * 测试目标：验证带编号义项标签（如 S1Verb）会被识别并换行，确保义项层级清晰。
 * 前置条件：输入为无换行的 Markdown 串，包含 `Senses:S1Verb`、`Example1` 等标签。
 * 步骤：
 *  1) 构造紧贴的义项、例句、用法说明字段字符串。
 *  2) 调用 polishDictionaryMarkdown 进行格式化。
 * 断言：
 *  - 输出中每个标签独占一行，义项标签被格式化为 “Sense {编号} · {词性}”。
 * 边界/异常：
 *  - 覆盖义项编号扩展场景，防止后续解析逻辑回退到单行输出。
 */
test("polishDictionaryMarkdown formats sense label chains", () => {
  const source =
    "Senses:S1Verb:to move toward the speaker.Examples:Example1:She came home immediately.UsageInsight:Common in storytelling.";
  const result = polishDictionaryMarkdown(source);
  expect(result).toBe(
    [
      "**Senses**:",
      "**Sense 1 · Verb**: to move toward the speaker.",
      "**Examples**:",
      "**Example 1**: She came home immediately.",
      "**Usage Insight**: Common in storytelling.",
    ].join("\n"),
  );
});
