/**
 * 背景：
 *  - 历史导出与词典流式渲染均需将 Markdown 字段转为纯文本，但各自实现重复且未处理零宽空格。
 * 目的：
 *  - 提供统一的 Markdown 纯文本清洗策略，确保不同消费方得到一致的可读输出。
 * 关键决策与取舍：
 *  - 采用轻量函数封装而非类，保持调用端简单；零宽空格统一映射为显式空格以恢复英文单词间距。
 * 影响范围：
 *  - 历史导出及词典流式渲染等使用 stripMarkdownArtifacts 的模块。
 * 演进与TODO：
 *  - 如需扩展更多 Markdown 语法，可在此模块增加可组合的策略数组。
 */

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
