/**
 * 背景：
 *  - 历史记录中“发音解释”字段包含多层结构，需要展开为线性文本。
 * 目的：
 *  - 提供责任链式的释义收集器，将结构化含义转写为导出章节行。
 * 关键决策与取舍：
 *  - 维持函数式 collector 接口，既能在数组中自由组合，也方便单元测试；
 *  - 释义顺序保持原始索引，保证与产品展示一致性。
 * 影响范围：
 *  - 偏好设置导出的 Definitions 章节。
 * 演进与TODO：
 *  - 可在此扩展更多关系词类型或格式化策略。
 */

import { stripMarkdownArtifacts } from "@features/dictionary-experience/markdown/dictionaryPlainTextSanitizer.js";

import { pushChapter } from "./chapterNormalization.js";

const DEFAULT_LABELS = {
  definitionsLabel: "Definitions",
  synonymsLabel: "同义词",
  antonymsLabel: "反义词",
  relatedLabel: "相关词",
};

const normalizeRelationLine = (label, items = []) => {
  if (!Array.isArray(items) || items.length === 0) {
    return "";
  }
  return `${label}: ${items.join("、")}`;
};

const collectExampleLines = (examples = []) => {
  if (!Array.isArray(examples)) {
    return [];
  }
  return examples.flatMap((example) => {
    const source = stripMarkdownArtifacts(example?.源语言);
    const translation = stripMarkdownArtifacts(example?.翻译);
    const rendered = [];
    if (source) {
      rendered.push(`· ${source}`);
    }
    if (translation) {
      rendered.push(`  ${translation}`);
    }
    return rendered;
  });
};

const collectSenseLines = ({
  sense,
  relations,
  orderLabel,
  labels,
}) => {
  const lines = [];
  const definitionParts = [
    stripMarkdownArtifacts(sense?.定义),
    stripMarkdownArtifacts(sense?.类别),
  ].filter(Boolean);
  if (definitionParts.length > 0) {
    lines.push(`${orderLabel} ${definitionParts.join(" · ")}`);
  }
  const relationLines = [
    normalizeRelationLine(labels.synonymsLabel, relations?.同义词),
    normalizeRelationLine(labels.antonymsLabel, relations?.反义词),
    normalizeRelationLine(labels.relatedLabel, relations?.相关词),
  ].filter(Boolean);
  lines.push(...relationLines);
  lines.push(...collectExampleLines(sense?.例句));
  return lines;
};

const collectGroupLines = (group, groupIndex, labels) => {
  const senses = Array.isArray(group?.释义) ? group.释义 : [];
  return senses.flatMap((sense, senseIndex) =>
    collectSenseLines({
      sense,
      relations: sense?.关系词 || {},
      orderLabel: `${groupIndex + 1}.${senseIndex + 1}`,
      labels,
    }),
  );
};

/**
 * 意图：展开结构化释义并写入章节集合。
 * 输入：entry、translations、chapters、fallback。
 * 输出：对 chapters 产生副作用。
 * 流程：双层循环按索引组合 orderLabel，并拼装释义、关系词与例句。
 */
export const collectStructuredDefinitions = ({
  entry,
  translations,
  chapters,
  fallback,
}) => {
  const groups = Array.isArray(entry?.["发音解释"]) ? entry["发音解释"] : [];
  if (groups.length === 0) {
    return;
  }
  const labels = { ...DEFAULT_LABELS, ...translations };
  const lines = groups.flatMap((group, groupIndex) =>
    collectGroupLines(group, groupIndex, labels),
  );
  if (lines.length > 0) {
    pushChapter(chapters, labels.definitionsLabel, lines, fallback);
  }
};
