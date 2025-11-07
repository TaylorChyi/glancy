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
