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
