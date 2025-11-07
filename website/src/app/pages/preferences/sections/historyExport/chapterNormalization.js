import { stripMarkdownArtifacts } from "@features/dictionary-experience/markdown/dictionaryPlainTextSanitizer.js";

const toTrimmedString = (value) => {
  if (value == null) return "";
  if (typeof value === "string") return value.trim();
  return String(value).trim();
};

/**
 * 意图：在推入章节前统一标题与正文内容。
 * 输入：章节集合、标题、行数组、默认标题。
 * 输出：对传入 chapters 产生副作用，返回 void。
 * 流程：
 *  1) 标题与行内容做空值兜底；
 *  2) 过滤空行；
 *  3) 仅当存在有效行时推入章节。
 * 错误处理：保持静默，调用方负责验证入参。
 * 复杂度：O(k)，k 为行数。
 */
export const pushChapter = (chapters, heading, lines, fallbackHeading) => {
  const normalizedHeading = toTrimmedString(heading) || fallbackHeading;
  const normalizedLines = Array.isArray(lines)
    ? lines
        .map((line) => stripMarkdownArtifacts(line))
        .map((line) => line.trim())
        .filter((line) => line.length > 0)
    : [];
  if (normalizedLines.length === 0) {
    return;
  }
  chapters.push({ heading: normalizedHeading, lines: normalizedLines });
};
