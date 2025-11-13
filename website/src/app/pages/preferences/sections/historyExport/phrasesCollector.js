import { stripMarkdownArtifacts } from "@features/dictionary-experience/markdown/dictionaryPlainTextSanitizer.js";

import { pushChapter } from "./chapterNormalization.js";

const DEFAULT_LABEL = "常见词组";

const sanitizePhraseField = (value) =>
  typeof value === "string" ? stripMarkdownArtifacts(value) : "";

export const normalizePhraseEntry = (phrase) => {
  if (typeof phrase === "string") {
    const text = sanitizePhraseField(phrase);
    return text ? { name: text, meaning: "" } : null;
  }

  const name = sanitizePhraseField(phrase?.词组);
  const meaning = sanitizePhraseField(phrase?.释义 ?? phrase?.解释);

  if (!name) {
    return null;
  }

  return { name, meaning };
};

export const formatPhraseBullet = ({ name, meaning }) =>
  meaning ? `• ${name} — ${meaning}` : `• ${name}`;

export const buildPhraseLines = (phrases = []) =>
  phrases
    .map(normalizePhraseEntry)
    .filter(Boolean)
    .map(formatPhraseBullet);

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

  const lines = buildPhraseLines(phrases);

  if (lines.length === 0) {
    return;
  }

  pushChapter(
    chapters,
    translations?.phrasesLabel ?? DEFAULT_LABEL,
    lines,
    fallback,
  );
};
