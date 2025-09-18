import { extractMarkdownPreview } from "./markdown.js";

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
  expect(result).toBe("Line 1\n\nHe said: \"hi\"");
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
