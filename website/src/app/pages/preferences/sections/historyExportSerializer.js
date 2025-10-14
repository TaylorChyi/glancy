/**
 * 背景：
 *  - 过往导出仅序列化历史元数据，无法满足“按照章节分类沉淀释义”的新诉求。
 * 目的：
 *  - 抽象出历史导出的模板方法骨架，便于未来扩展不同格式（CSV/JSON）或字段组合；
 *    当前实现以“章节”作为分类单元，确保同一词条的释义被聚合在同一单元格中。
 * 关键决策与取舍：
 *  - 采用模板方法 + 策略式注入章节解析器：基类负责 CSV 正规化，子类聚焦章节解构，
 *    相比一次性函数更便于替换导出介质或扩充列结构；
 *  - 章节解析优先复用词典分享模型的语义切分，其次退化为 Markdown 章节拆解，
 *    以兼容旧版缓存与流式落地的 markdown-only 结果。
 * 影响范围：
 *  - Preferences DataSection 的导出逻辑；未来若新增导出格式可复用同一骨架。
 * 演进与TODO：
 *  - TODO: 后续可根据语言/词典风格注入更细颗粒的章节映射，或增加 JSON/Excel 导出策略。
 */
import { normalizeDictionaryMarkdown } from "@features/dictionary-experience/markdown/dictionaryMarkdownNormalizer.js";
import { stripMarkdownArtifacts } from "@features/dictionary-experience/markdown/dictionaryPlainTextSanitizer.js";

const normalizeCsvValue = (value) => {
  if (value === null || value === undefined) {
    return "";
  }
  const stringValue = String(value);
  if (/[",\n\r]/.test(stringValue)) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
};

const toCsvRow = (values) => values.map(normalizeCsvValue).join(",");

const joinChapterContent = (lines = []) =>
  lines
    .filter((line) => typeof line === "string" && line.trim().length > 0)
    .join("\n");

const isMarkdownHeading = (line) =>
  typeof line === "string" && /^#{1,6}\s+/.test(line.trim());

const stripHeadingMarker = (line) => line.replace(/^#{1,6}\s+/, "").trim();

const splitMarkdownLinesIntoChapters = (lines, fallbackHeading) => {
  if (!Array.isArray(lines) || lines.length === 0) {
    return [];
  }
  const chapters = [];
  let current = { heading: fallbackHeading, lines: [] };

  const flush = () => {
    if (current.lines.length === 0 && current.heading === fallbackHeading) {
      return;
    }
    chapters.push({
      heading: current.heading,
      lines: [...current.lines],
    });
    current = { heading: fallbackHeading, lines: [] };
  };

  lines.forEach((line) => {
    if (isMarkdownHeading(line)) {
      if (current.lines.length > 0 || current.heading !== fallbackHeading) {
        flush();
      }
      const heading = stripHeadingMarker(line);
      current.heading = heading || fallbackHeading;
      return;
    }
    const trimmed = typeof line === "string" ? line.trimEnd() : "";
    if (trimmed.length > 0) {
      current.lines.push(trimmed);
    }
  });

  if (current.lines.length > 0 || current.heading !== fallbackHeading) {
    flush();
  }

  return chapters;
};

const toTrimmedString = (value) => {
  if (value == null) return "";
  if (typeof value === "string") return value.trim();
  return String(value).trim();
};

const pushChapter = (chapters, heading, lines, fallbackHeading) => {
  const normalizedHeading = toTrimmedString(heading) || fallbackHeading;
  const normalizedLines = Array.isArray(lines)
    ? lines
        .map((line) => stripMarkdownArtifacts(line))
        .filter((line) => line.length > 0)
    : [];
  if (normalizedLines.length === 0) {
    return;
  }
  chapters.push({ heading: normalizedHeading, lines: normalizedLines });
};

const collectStructuredPhonetics = (
  entry,
  translations,
  chapters,
  fallback,
) => {
  const phonetic = entry?.["发音"] || {};
  const lines = [];
  const en = stripMarkdownArtifacts(phonetic?.["英音"]);
  const us = stripMarkdownArtifacts(phonetic?.["美音"]);
  if (en) {
    lines.push(`${translations?.phoneticLabelEn ?? "英音"}: ${en}`);
  }
  if (us) {
    lines.push(`${translations?.phoneticLabelUs ?? "美音"}: ${us}`);
  }
  if (lines.length > 0) {
    pushChapter(
      chapters,
      translations?.phoneticLabel ?? "Phonetic",
      lines,
      fallback,
    );
  }
};

const collectStructuredDefinitions = (
  entry,
  translations,
  chapters,
  fallback,
) => {
  const groups = Array.isArray(entry?.["发音解释"]) ? entry["发音解释"] : [];
  if (groups.length === 0) {
    return;
  }
  const definitionLines = [];
  const synLabel = translations?.synonymsLabel ?? "同义词";
  const antLabel = translations?.antonymsLabel ?? "反义词";
  const relLabel = translations?.relatedLabel ?? "相关词";
  groups.forEach((group, groupIndex) => {
    const senses = Array.isArray(group?.释义) ? group.释义 : [];
    senses.forEach((sense, senseIndex) => {
      const orderLabel = `${groupIndex + 1}.${senseIndex + 1}`;
      const senseText = [
        stripMarkdownArtifacts(sense?.定义),
        stripMarkdownArtifacts(sense?.类别),
      ]
        .filter(Boolean)
        .join(" · ");
      if (senseText) {
        definitionLines.push(`${orderLabel} ${senseText}`);
      }
      const relations = sense?.关系词 || {};
      if (Array.isArray(relations.同义词) && relations.同义词.length > 0) {
        definitionLines.push(`${synLabel}: ${relations.同义词.join("、")}`);
      }
      if (Array.isArray(relations.反义词) && relations.反义词.length > 0) {
        definitionLines.push(`${antLabel}: ${relations.反义词.join("、")}`);
      }
      if (Array.isArray(relations.相关词) && relations.相关词.length > 0) {
        definitionLines.push(`${relLabel}: ${relations.相关词.join("、")}`);
      }
      const examples = Array.isArray(sense?.例句) ? sense.例句 : [];
      examples.forEach((example) => {
        const source = stripMarkdownArtifacts(example?.源语言);
        const translation = stripMarkdownArtifacts(example?.翻译);
        if (source) {
          definitionLines.push(`· ${source}`);
        }
        if (translation) {
          definitionLines.push(`  ${translation}`);
        }
      });
    });
  });
  if (definitionLines.length > 0) {
    pushChapter(
      chapters,
      translations?.definitionsLabel ?? "Definitions",
      definitionLines,
      fallback,
    );
  }
};

const collectStructuredVariants = (entry, translations, chapters, fallback) => {
  const variants = Array.isArray(entry?.["变形"]) ? entry["变形"] : [];
  if (variants.length === 0) {
    return;
  }
  const lines = variants
    .map((variant) => {
      const state = stripMarkdownArtifacts(variant?.状态);
      const form = stripMarkdownArtifacts(variant?.词形);
      if (!form) {
        return "";
      }
      return state ? `${state}：${form}` : form;
    })
    .filter(Boolean);
  if (lines.length > 0) {
    pushChapter(
      chapters,
      translations?.variantsLabel ?? "Variants",
      lines,
      fallback,
    );
  }
};

const collectStructuredPhrases = (entry, translations, chapters, fallback) => {
  const phrases = Array.isArray(entry?.["常见词组"]) ? entry["常见词组"] : [];
  if (phrases.length === 0) {
    return;
  }
  const lines = phrases
    .map((phrase) => {
      if (typeof phrase === "string") {
        return `• ${stripMarkdownArtifacts(phrase)}`;
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
      translations?.phrasesLabel ?? "常见词组",
      lines,
      fallback,
    );
  }
};

const deriveChaptersFromEntry = ({ entry, translations }) => {
  if (!entry || typeof entry !== "object") {
    return [];
  }
  const fallbackHeading =
    translations?.settingsDataExportDefaultChapter ?? "General";
  const chapters = [];

  if (Array.isArray(entry.sections) && entry.sections.length > 0) {
    entry.sections.forEach((section) => {
      const lines = Array.isArray(section?.lines)
        ? section.lines
        : [section?.content ?? ""];
      pushChapter(chapters, section?.heading, lines, fallbackHeading);
    });
  }

  const markdownSource =
    typeof entry.markdown === "string" && entry.markdown.trim().length > 0
      ? entry.markdown
      : "";
  if (markdownSource) {
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
    } else if (normalizedMarkdown.trim().length > 0) {
      pushChapter(
        chapters,
        fallbackHeading,
        [normalizedMarkdown.trim()],
        fallbackHeading,
      );
    }
  }

  if (typeof entry.phonetic === "string" && entry.phonetic.trim().length > 0) {
    pushChapter(
      chapters,
      translations?.phoneticLabel ?? "Phonetic",
      [entry.phonetic],
      fallbackHeading,
    );
  }
  if (Array.isArray(entry.definitions) && entry.definitions.length > 0) {
    pushChapter(
      chapters,
      translations?.definitionsLabel ?? "Definitions",
      entry.definitions,
      fallbackHeading,
    );
  }
  if (typeof entry.example === "string" && entry.example.trim().length > 0) {
    pushChapter(
      chapters,
      translations?.exampleLabel ?? "Example",
      [entry.example],
      fallbackHeading,
    );
  }

  collectStructuredPhonetics(entry, translations, chapters, fallbackHeading);
  collectStructuredDefinitions(entry, translations, chapters, fallbackHeading);
  collectStructuredVariants(entry, translations, chapters, fallbackHeading);
  collectStructuredPhrases(entry, translations, chapters, fallbackHeading);

  if (chapters.length > 0) {
    return chapters;
  }

  return [];
};

class HistoryCsvSerializerTemplate {
  serialize(historyItems, context) {
    const rows = [];
    const safeHistory = Array.isArray(historyItems) ? historyItems : [];
    const header = this.buildHeader(context);
    if (header && header.length > 0) {
      rows.push(header);
    }
    this.buildRows(safeHistory, context).forEach((row) => {
      if (Array.isArray(row) && row.length > 0) {
        rows.push(row);
      }
    });
    return rows.map((row) => toCsvRow(row)).join("\r\n");
  }

  buildHeader() {
    // 采用模板方法模式，通过显式抛错约束子类覆写，避免静默回退默认空结构。
    throw new Error(
      `${this.constructor.name} must implement buildHeader(context)`,
    );
  }

  buildRows() {
    throw new Error(
      `${this.constructor.name} must implement buildRows(historyItems, context)`,
    );
  }
}

export class DefinitionsByChapterCsvSerializer extends HistoryCsvSerializerTemplate {
  buildHeader(context) {
    const chapterColumn =
      context?.translations?.settingsDataExportChapterColumn ?? "chapter";
    const contentColumn =
      context?.translations?.settingsDataExportContentColumn ?? "content";
    return ["term", "language", "flavor", chapterColumn, contentColumn];
  }

  buildRows(historyItems, context) {
    const { resolveEntry, translations } = context ?? {};
    const rows = [];
    historyItems.forEach((item) => {
      if (!item) {
        return;
      }
      const entry =
        typeof resolveEntry === "function" ? resolveEntry(item) : undefined;
      const chapters = deriveChaptersFromEntry({
        entry,
        translations,
        term: item.term,
      });
      if (chapters.length === 0) {
        rows.push([
          item?.term ?? "",
          item?.language ?? "",
          item?.flavor ?? "",
          translations?.settingsDataExportDefaultChapter ?? "General",
          "",
        ]);
        return;
      }
      chapters.forEach((chapter) => {
        rows.push([
          item?.term ?? "",
          item?.language ?? "",
          item?.flavor ?? "",
          chapter.heading,
          joinChapterContent(chapter.lines),
        ]);
      });
    });
    return rows;
  }
}

export const definitionsByChapterCsvSerializer =
  new DefinitionsByChapterCsvSerializer();

export const __INTERNAL__ = Object.freeze({
  normalizeCsvValue,
  toCsvRow,
  splitMarkdownLinesIntoChapters,
  deriveChaptersFromEntry,
});
