/**
 * 背景：
 *  - 不同来源的章节数据结构不一致，需要统一标题与行内容的清洗规则。
 * 目的：
 *  - 提供章节标题与正文的归一化工具，确保导出文件呈现稳定语义。
 * 关键决策与取舍：
 *  - 依赖词典体验模块的 stripMarkdownArtifacts 以去除 Markdown 噪点，
 *    避免重复造轮子；
 *  - 仅在有有效行内容时才推入章节，减少空章节噪音。
 * 影响范围：
 *  - 所有章节拼装策略的公共数据清洗能力。
 * 演进与TODO：
 *  - 若后续需要多语种标题映射，可在 pushChapter 中注入策略接口。
 */

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
