import { pushChapter } from "./chapterNormalization.js";
import {
  buildPhraseLines,
  extractPhrasesFromEntry,
  hasPhraseContent,
} from "./phrasesHelpers.js";

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
  const phrases = extractPhrasesFromEntry(entry);
  if (!hasPhraseContent(phrases)) {
    return;
  }

  const lines = buildPhraseLines(phrases);

  if (!hasPhraseContent(lines)) {
    return;
  }

  pushChapter(
    chapters,
    translations?.phrasesLabel ?? DEFAULT_LABEL,
    lines,
    fallback,
  );
};
