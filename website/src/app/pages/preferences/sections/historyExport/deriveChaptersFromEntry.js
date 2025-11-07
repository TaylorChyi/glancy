import { normalizeDictionaryMarkdown } from "@features/dictionary-experience/markdown/dictionaryMarkdownNormalizer.js";

import { pushChapter } from "./chapterNormalization.js";
import { splitMarkdownLinesIntoChapters } from "./markdownChapterParser.js";
import { collectStructuredDefinitions } from "./definitionsCollector.js";
import { collectStructuredPhonetics } from "./phoneticsCollector.js";
import { collectStructuredVariants } from "./variantsCollector.js";
import { collectStructuredPhrases } from "./phrasesCollector.js";

const DEFAULT_FALLBACK_HEADING = "General";

const STRUCTURED_COLLECTORS = [
  collectStructuredPhonetics,
  collectStructuredDefinitions,
  collectStructuredVariants,
  collectStructuredPhrases,
];

const PLAIN_FIELD_CONFIGS = [
  {
    labelKey: "phoneticLabel",
    fallbackLabel: "Phonetic",
    resolveLines: (entry) =>
      typeof entry.phonetic === "string" && entry.phonetic.trim().length > 0
        ? [entry.phonetic]
        : [],
  },
  {
    labelKey: "definitionsLabel",
    fallbackLabel: "Definitions",
    resolveLines: (entry) =>
      Array.isArray(entry.definitions) ? entry.definitions : [],
  },
  {
    labelKey: "exampleLabel",
    fallbackLabel: "Example",
    resolveLines: (entry) =>
      typeof entry.example === "string" && entry.example.trim().length > 0
        ? [entry.example]
        : [],
  },
];

const pushPlainFields = ({
  entry,
  translations,
  chapters,
  fallbackHeading,
}) => {
  PLAIN_FIELD_CONFIGS.forEach(({ labelKey, fallbackLabel, resolveLines }) => {
    const lines = resolveLines(entry);
    if (lines.length === 0) {
      return;
    }
    pushChapter(
      chapters,
      translations?.[labelKey] ?? fallbackLabel,
      lines,
      fallbackHeading,
    );
  });
};

const pushLegacySections = ({ entry, chapters, fallbackHeading }) => {
  if (!Array.isArray(entry.sections) || entry.sections.length === 0) {
    return;
  }
  entry.sections.forEach((section) => {
    const lines = Array.isArray(section?.lines)
      ? section.lines
      : [section?.content ?? ""];
    pushChapter(chapters, section?.heading, lines, fallbackHeading);
  });
};

const pushMarkdown = ({ entry, chapters, fallbackHeading }) => {
  const markdownSource =
    typeof entry.markdown === "string" && entry.markdown.trim().length > 0
      ? entry.markdown
      : "";
  if (!markdownSource) {
    return;
  }
  const normalizedMarkdown = normalizeDictionaryMarkdown(markdownSource);
  const lines = normalizedMarkdown.split(/\r?\n/);
  const markdownChapters = splitMarkdownLinesIntoChapters(
    lines,
    fallbackHeading,
  );
  if (markdownChapters.length > 0) {
    markdownChapters.forEach((chapter) => {
      pushChapter(chapters, chapter.heading, chapter.lines, fallbackHeading);
    });
    return;
  }
  if (normalizedMarkdown.trim().length > 0) {
    pushChapter(
      chapters,
      fallbackHeading,
      [normalizedMarkdown.trim()],
      fallbackHeading,
    );
  }
};

const runStructuredCollectors = ({
  entry,
  translations,
  chapters,
  fallback,
}) => {
  STRUCTURED_COLLECTORS.forEach((collector) =>
    collector({ entry, translations, chapters, fallback }),
  );
};

/**
 * 意图：归并词典历史条目中的各来源文本，产出章节数组。
 * 输入：entry（词条数据）、translations（多语言标签）。
 * 输出：包含 heading 与 lines 的章节数组；若无有效内容则返回空数组。
 * 流程：
 *  1) 判空与 fallback 标题准备；
 *  2) 注入 legacy sections；
 *  3) 解析 Markdown；
 *  4) 推送基础字段；
 *  5) 运行结构化 collector。
 */
export const deriveChaptersFromEntry = ({ entry, translations }) => {
  if (!entry || typeof entry !== "object") {
    return [];
  }
  const fallbackHeading =
    translations?.settingsDataExportDefaultChapter ?? DEFAULT_FALLBACK_HEADING;
  const chapters = [];

  pushLegacySections({ entry, chapters, fallbackHeading });
  pushMarkdown({ entry, chapters, fallbackHeading });
  pushPlainFields({ entry, translations, chapters, fallbackHeading });
  runStructuredCollectors({
    entry,
    translations,
    chapters,
    fallback: fallbackHeading,
  });

  return chapters;
};
