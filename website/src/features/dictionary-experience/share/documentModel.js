/**
 * 背景：
 *  - 分享长图的文档结构需要同时兼容 Markdown 文本、旧版词条与结构化词条三种来源，原文件将其与 Canvas 渲染耦合在一起难以演进。
 * 目的：
 *  - 提供单一职责的文档建造器，专注数据整形，确保渲染层只负责排版与绘制。
 * 关键决策与取舍：
 *  - 采用建造者模式封装标题/段落追加流程，避免在调用侧散落可变逻辑；
 *  - 保持函数纯度，便于单测覆盖与未来扩展更多数据源；
 *  - 保留遗留入口（legacy/structured）以兼容现有 API，避免一次性迁移风险。
 * 影响范围：
 *  - 词典分享图导出流程的上游数据整形逻辑。
 * 演进与TODO：
 *  - 后续可在此增加主题化排版信息或多语言排序策略。
 */

import { normalizeDictionaryMarkdown } from "@features/dictionary-experience/markdown/dictionaryMarkdownNormalizer.js";
import { stripMarkdownArtifacts } from "@features/dictionary-experience/markdown/dictionaryPlainTextSanitizer.js";

import { toTrimmedString } from "./documentFormatting.js";

class ShareDocumentBuilder {
  constructor() {
    this.title = "";
    this.sections = [];
  }

  setTitle(title) {
    const nextTitle = toTrimmedString(title);
    if (nextTitle) {
      this.title = nextTitle;
    }
    return this;
  }

  addSection(heading, lines) {
    const normalisedHeading = toTrimmedString(heading);
    const safeLines = Array.isArray(lines)
      ? lines
          .map((line) => toTrimmedString(line))
          .filter((line, index, arr) => line || index !== arr.length - 1)
      : [];

    if (!normalisedHeading && safeLines.length === 0) {
      return this;
    }

    this.sections.push({ heading: normalisedHeading, lines: safeLines });
    return this;
  }

  build() {
    return Object.freeze({
      title: this.title,
      sections: this.sections.map((section) => ({
        heading: section.heading,
        lines: [...section.lines],
      })),
    });
  }
}

const buildFromMarkdown = (source) => {
  const trimmed = toTrimmedString(source);
  if (!trimmed) {
    return [];
  }
  return normalizeDictionaryMarkdown(trimmed)
    .split(/\r?\n/)
    .map((line) => line.replace(/\s+$/g, ""));
};

const buildFromLegacyEntry = (entry, t) => {
  const sections = [];
  if (entry.phonetic) {
    sections.push({
      heading: t.phoneticLabel,
      lines: [stripMarkdownArtifacts(entry.phonetic)],
    });
  }
  if (Array.isArray(entry.definitions) && entry.definitions.length > 0) {
    sections.push({
      heading: t.definitionsLabel,
      lines: entry.definitions.map((definition, index) =>
        `${index + 1}. ${stripMarkdownArtifacts(definition)}`,
      ),
    });
  }
  if (entry.example) {
    sections.push({
      heading: t.exampleLabel,
      lines: [stripMarkdownArtifacts(entry.example)],
    });
  }
  return sections;
};

const toArray = (value) => (Array.isArray(value) ? value : []);

const createPhoneticSection = (entry, t) => {
  const phonetic = entry?.["发音"] || {};
  const lines = [
    phonetic?.["英音"]
      ? `${t.phoneticLabelEn ?? "英音"}: ${stripMarkdownArtifacts(phonetic["英音"])}`
      : null,
    phonetic?.["美音"]
      ? `${t.phoneticLabelUs ?? "美音"}: ${stripMarkdownArtifacts(phonetic["美音"])}`
      : null,
  ].filter(Boolean);
  return lines.length > 0 ? { heading: t.phoneticLabel, lines } : null;
};

const appendRelationLines = (lines, relations, labels) => {
  const { synLabel, antLabel, relLabel } = labels;
  const append = (label, values) => {
    if (Array.isArray(values) && values.length > 0) {
      lines.push(`${label}: ${values.join("、")}`);
    }
  };
  append(synLabel, relations.同义词);
  append(antLabel, relations.反义词);
  append(relLabel, relations.相关词);
};

const appendExampleLines = (lines, examples) => {
  toArray(examples).forEach((example) => {
    const source = stripMarkdownArtifacts(example?.源语言);
    const translation = stripMarkdownArtifacts(example?.翻译);
    if (source) {
      lines.push(`· ${source}`);
    }
    if (translation) {
      lines.push(`  ${translation}`);
    }
  });
};

const createDefinitionSection = (entry, t) => {
  const groups = toArray(entry?.["发音解释"]);
  if (groups.length === 0) {
    return null;
  }
  const lines = [];
  const labels = {
    synLabel: t.synonymsLabel ?? "同义词",
    antLabel: t.antonymsLabel ?? "反义词",
    relLabel: t.relatedLabel ?? "相关词",
  };
  groups.forEach((group, groupIndex) => {
    toArray(group?.释义).forEach((sense, senseIndex) => {
      const orderLabel = `${groupIndex + 1}.${senseIndex + 1}`;
      const senseText = [stripMarkdownArtifacts(sense?.定义), sense?.类别]
        .filter(Boolean)
        .join(" · ");
      if (senseText) {
        lines.push(`${orderLabel} ${senseText}`);
      }
      appendRelationLines(lines, sense?.关系词 || {}, labels);
      appendExampleLines(lines, sense?.例句);
    });
  });
  return lines.length > 0 ? { heading: t.definitionsLabel, lines } : null;
};

const createVariantsSection = (entry, t) => {
  const variants = toArray(entry?.["变形"]);
  if (variants.length === 0) {
    return null;
  }
  return {
    heading: t.variantsLabel ?? "变形",
    lines: variants.map(
      (variant) =>
        `${stripMarkdownArtifacts(variant?.状态)}：${stripMarkdownArtifacts(variant?.词形)}`,
    ),
  };
};

const createPhrasesSection = (entry, t) => {
  const phrases = toArray(entry?.["常见词组"]);
  if (phrases.length === 0) {
    return null;
  }
  const lines = phrases.map((phrase) => {
    if (typeof phrase === "string") {
      return `• ${stripMarkdownArtifacts(phrase)}`;
    }
    const name = stripMarkdownArtifacts(phrase?.词组);
    const meaning = stripMarkdownArtifacts(phrase?.释义 ?? phrase?.解释);
    return meaning ? `• ${name} — ${meaning}` : `• ${name}`;
  });
  return { heading: t.phrasesLabel ?? "常见词组", lines };
};

const buildFromStructuredEntry = (entry, t) =>
  [
    createPhoneticSection(entry, t),
    createDefinitionSection(entry, t),
    createVariantsSection(entry, t),
    createPhrasesSection(entry, t),
  ].filter(Boolean);

const resolveMarkdownSource = (entry, fallback) => {
  if (typeof entry?.markdown === "string" && entry.markdown.trim()) {
    return entry.markdown;
  }
  if (typeof fallback === "string") {
    return fallback;
  }
  return "";
};

const isLegacyEntry = (entry) =>
  Boolean(entry?.phonetic || entry?.definitions || entry?.example);

const hasStructuredContent = (entry) =>
  Boolean(entry?.["发音解释"] || entry?.["常见词组"]);

export function buildShareDocument({ term, entry, finalText, t }) {
  const builder = new ShareDocumentBuilder();
  builder.setTitle(term || entry?.term || "");

  const markdownSource = resolveMarkdownSource(entry, finalText);

  if (markdownSource.trim()) {
    builder.addSection("", buildFromMarkdown(markdownSource));
    return builder.build();
  }

  if (entry) {
    if (isLegacyEntry(entry)) {
      buildFromLegacyEntry(entry, t).forEach((section) =>
        builder.addSection(section.heading, section.lines),
      );
      return builder.build();
    }
    if (hasStructuredContent(entry)) {
      buildFromStructuredEntry(entry, t).forEach((section) =>
        builder.addSection(section.heading, section.lines),
      );
      return builder.build();
    }
  }

  builder.addSection("", buildFromMarkdown(finalText));
  return builder.build();
}

export const __INTERNAL__ = Object.freeze({
  ShareDocumentBuilder,
  buildFromMarkdown,
  buildFromLegacyEntry,
  buildFromStructuredEntry,
});
