const MARKDOWN_INLINE_TOKENS = /[`*_~>#]/g;
const MARKDOWN_LINK_PATTERN = /\[(.*?)\]\((.*?)\)/g;
const ZERO_WIDTH_WHITESPACE = /\u200B|\u200C|\u200D|\u2060|\uFEFF/gu;

function toNormalizedString(value) {
  if (value == null) {
    return "";
  }
  if (typeof value === "string") {
    return value.trim();
  }
  return String(value).trim();
}

/**
 * 意图：去除 Markdown 装饰符并恢复可见空格。
 * 输入：任意可序列化为字符串的字段值。
 * 输出：清洗后的纯文本。
 * 流程：
 *  1) 归一化输入并移除行内强调、链接等 Markdown 元素；
 *  2) 将零宽及特殊空白统一替换为普通空格；
 *  3) 压缩连续空白并裁剪首尾间距。
 * 错误处理：遇到 nullish 输入返回空串。
 * 复杂度：O(n)，n 为文本长度。
 */
export function stripMarkdownArtifacts(value) {
  const normalized = toNormalizedString(value);
  if (!normalized) {
    return "";
  }

  const withoutMarkdown = normalized
    .replace(MARKDOWN_INLINE_TOKENS, "")
    .replace(MARKDOWN_LINK_PATTERN, "$1");

  return withoutMarkdown
    .replace(ZERO_WIDTH_WHITESPACE, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export const __INTERNAL__ = Object.freeze({
  MARKDOWN_INLINE_TOKENS,
  MARKDOWN_LINK_PATTERN,
  ZERO_WIDTH_WHITESPACE,
});
