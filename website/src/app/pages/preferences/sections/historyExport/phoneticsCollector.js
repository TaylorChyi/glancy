/**
 * 背景：
 *  - 词典历史项中的发音字段结构化存储在 "发音" 键下。
 * 目的：
 *  - 将英美音等信息转换为章节，确保 CSV 导出拥有可辨识标签。
 * 关键决策与取舍：
 *  - 采用函数式 collector 接口，便于后续扩展其他语音维度。
 * 影响范围：
 *  - 偏好设置导出的发音章节内容。
 * 演进与TODO：
 *  - 支持更多发音类型（例如澳式），可通过扩展 entries 配置实现。
 */

import { stripMarkdownArtifacts } from "@features/dictionary-experience/markdown/dictionaryPlainTextSanitizer.js";

import { pushChapter } from "./chapterNormalization.js";

const DEFAULT_LABELS = {
  phoneticLabel: "Phonetic",
  phoneticLabelEn: "英音",
  phoneticLabelUs: "美音",
};

const resolveLabel = (translations, key) =>
  translations?.[key] ?? DEFAULT_LABELS[key];

/**
 * 意图：收集 entry 中的结构化发音信息并写入章节集合。
 * 输入：entry（含 "发音" 键）、translations、chapters、fallback 标题。
 * 输出：对 chapters 产生副作用。
 * 流程：清洗英美音后追加到统一章节。
 */
export const collectStructuredPhonetics = ({
  entry,
  translations,
  chapters,
  fallback,
}) => {
  const phonetic = entry?.["发音"] || {};
  const lines = [];
  const en = stripMarkdownArtifacts(phonetic?.["英音"]);
  const us = stripMarkdownArtifacts(phonetic?.["美音"]);
  if (en) {
    lines.push(`${resolveLabel(translations, "phoneticLabelEn")}: ${en}`);
  }
  if (us) {
    lines.push(`${resolveLabel(translations, "phoneticLabelUs")}: ${us}`);
  }
  if (lines.length > 0) {
    pushChapter(
      chapters,
      resolveLabel(translations, "phoneticLabel"),
      lines,
      fallback,
    );
  }
};
