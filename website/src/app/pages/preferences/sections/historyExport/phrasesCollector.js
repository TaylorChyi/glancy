/**
 * 背景：
 *  - “常见词组”字段存储字典条目的短语示例。
 * 目的：
 *  - 将词组与释义整齐输出，便于用户在 CSV 中快速检索。
 * 关键决策与取舍：
 *  - 保持符号前缀一致（•），以维持导出文件的阅读节奏。
 * 影响范围：
 *  - 偏好设置导出的 phrases 章节。
 * 演进与TODO：
 *  - 可按需扩展更多字段（例如例句来源）。
 */

import { stripMarkdownArtifacts } from "@features/dictionary-experience/markdown/dictionaryPlainTextSanitizer.js";

import { pushChapter } from "./chapterNormalization.js";

const DEFAULT_LABEL = "常见词组";

/**
 * 意图：将常见词组规范化并写入章节集合。
 * 输入：entry、translations、chapters、fallback。
 * 输出：对 chapters 产生副作用。
 */
export const collectStructuredPhrases = ({
  entry,
  translations,
  chapters,
  fallback,
}) => {
  const phrases = Array.isArray(entry?.["常见词组"]) ? entry["常见词组"] : [];
  if (phrases.length === 0) {
    return;
  }
  const lines = phrases
    .map((phrase) => {
      if (typeof phrase === "string") {
        const text = stripMarkdownArtifacts(phrase);
        return text ? `• ${text}` : "";
      }
      const name = stripMarkdownArtifacts(phrase?.词组);
      const meaning = stripMarkdownArtifacts(phrase?.释义 ?? phrase?.解释);
      if (!name) {
        return "";
      }
      return meaning ? `• ${name} — ${meaning}` : `• ${name}`;
    })
    .filter(Boolean);
  if (lines.length > 0) {
    pushChapter(
      chapters,
      translations?.phrasesLabel ?? DEFAULT_LABEL,
      lines,
      fallback,
    );
  }
};
