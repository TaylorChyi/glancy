import { pipeline } from "../../../shared/utils/pipeline.js";
import { normalizeDictionaryMarkdown } from "./dictionaryMarkdownNormalizer.js";

const DEFAULT_HEADINGS = Object.freeze({
  term: "# %term%",
  phonetic: "## 发音",
  definitions: "## 释义",
  variants: "## 变形",
  phrases: "## 常见词组",
});

const DEFAULT_LABELS = Object.freeze({
  phoneticEn: "英音",
  phoneticUs: "美音",
  synonyms: "同义词",
  antonyms: "反义词",
  related: "相关词",
  example: "例句",
  translation: "译文",
});

const toTrimmedString = (value) => {
  if (value == null) return "";
  if (typeof value === "string") return value.trim();
  return String(value).trim();
};

const isNonEmptyArray = (candidate) =>
  Array.isArray(candidate) && candidate.length > 0;

const sanitizeText = (value) =>
  toTrimmedString(value).replace(/\s+/g, (segment, index) =>
    index === 0 ? "" : " ",
  );

const createMarkdownState = (
  entry,
  headings = DEFAULT_HEADINGS,
  labels = DEFAULT_LABELS,
) => ({
  entry: entry ?? {},
  headings: headings ?? DEFAULT_HEADINGS,
  labels: labels ?? DEFAULT_LABELS,
  lines: [],
});

const resolveHeading = (state, key) => state.headings?.[key] ?? DEFAULT_HEADINGS[key];

const appendLines = (state, additions) =>
  isNonEmptyArray(additions)
    ? { ...state, lines: [...state.lines, ...additions] }
    : state;

const appendSection = (state, headingKey, content) => {
  if (!isNonEmptyArray(content)) {
    return state;
  }
  const heading = resolveHeading(state, headingKey);
  return heading ? appendLines(state, [heading, ...content, ""]) : state;
};

const ensureTermHeading = (state) => {
  const template = resolveHeading(state, "term");
  const term = sanitizeText(state.entry["词条"] ?? state.entry.term);
  if (!template || !term) {
    return state;
  }
  return appendLines(state, [template.replace("%term%", term), ""]);
};

const finalizeMarkdown = (state) => {
  const content = Array.isArray(state?.lines) ? state.lines.join("\n").trim() : "";
  return normalizeDictionaryMarkdown(content);
};

const injectStructuredPhonetics = (state) =>
  appendSection(
    state,
    "phonetic",
    buildStructuredPhoneticLines(state.entry, state.labels),
  );

const injectStructuredDefinitions = (state) =>
  appendSection(
    state,
    "definitions",
    buildStructuredDefinitionBlocks(state.entry, state.labels),
  );

const injectStructuredVariants = (state) =>
  appendSection(state, "variants", buildVariantLines(state.entry));

const injectStructuredPhrases = (state) =>
  appendSection(state, "phrases", buildPhraseLines(state.entry));

const structuredMarkdownPipeline = pipeline([
  ensureTermHeading,
  injectStructuredPhonetics,
  injectStructuredDefinitions,
  injectStructuredVariants,
  injectStructuredPhrases,
  finalizeMarkdown,
]);

const buildStructuredPhoneticLines = (entry, labels) => {
  const phonetic = entry?.["发音"] ?? {};
  const pairs = [
    { label: labels.phoneticEn, value: sanitizeText(phonetic?.["英音"]) },
    { label: labels.phoneticUs, value: sanitizeText(phonetic?.["美音"]) },
  ];
  return pairs
    .map(({ label, value }) => (value ? `- ${label}：${value}` : ""))
    .filter(Boolean);
};

const buildStructuredDefinitionBlocks = (entry, labels) => {
  const groups = Array.isArray(entry?.["发音解释"]) ? entry["发音解释"] : [];
  return groups.flatMap((group, groupIndex) =>
    buildGroupDefinitionBlocks(group, groupIndex, labels),
  );
};

const buildGroupDefinitionBlocks = (group, groupIndex, labels) => {
  const senses = Array.isArray(group?.释义) ? group.释义 : [];
  return senses.flatMap((sense, senseIndex) =>
    buildSenseBlocks({
      sense,
      order: `${groupIndex + 1}.${senseIndex + 1}`,
      labels,
    }),
  );
};

const buildSenseBlocks = ({ sense, order, labels }) => {
  const lines = [];
  const definitionLine = formatDefinitionLine({
    order,
    category: sanitizeText(sense?.类别),
    definition: sanitizeText(sense?.定义),
  });
  if (definitionLine) {
    lines.push(definitionLine);
  }
  lines.push(...buildRelationLines(sense?.关系词, labels));
  lines.push(...buildExampleLines(sense?.例句, labels));
  return lines;
};

const formatDefinitionLine = ({ order, category, definition }) => {
  if (!category && !definition) {
    return "";
  }
  const categoryPrefix = category
    ? `${category}${definition ? " · " : ""}`
    : "";
  return `${order}. ${categoryPrefix}${definition ?? ""}`.trimEnd();
};

const buildRelationLines = (relations = {}, labels) => {
  const synonyms = formatRelationLine(labels.synonyms, relations?.同义词);
  const antonyms = formatRelationLine(labels.antonyms, relations?.反义词);
  const related = formatRelationLine(labels.related, relations?.相关词);
  return [synonyms, antonyms, related].filter(Boolean);
};

const formatRelationLine = (label, values) => {
  const tokens = (Array.isArray(values) ? values : [])
    .map(sanitizeText)
    .filter(Boolean);
  return tokens.length ? `  - ${label}：${tokens.join("、")}` : "";
};

const buildExampleLines = (examples, labels) =>
  (Array.isArray(examples) ? examples : []).flatMap((example) => {
    const source = sanitizeText(example?.源语言);
    const translation = sanitizeText(example?.翻译);
    const lines = [];
    if (source) {
      lines.push(`  - ${labels.example}：${source}`);
    }
    if (translation) {
      lines.push(`    ${labels.translation}：${translation}`);
    }
    return lines;
  });

const buildVariantLines = (entry) =>
  (Array.isArray(entry?.["变形"]) ? entry["变形"] : [])
    .map((variant) => {
      const form = sanitizeText(variant?.词形);
      if (!form) return "";
      const state = sanitizeText(variant?.状态);
      return `- ${state ? `${state}：` : ""}${form}`;
    })
    .filter(Boolean);

const buildPhraseLines = (entry) =>
  (Array.isArray(entry?.["常见词组"]) ? entry["常见词组"] : [])
    .map((phrase) => {
      if (typeof phrase === "string") {
        const value = sanitizeText(phrase);
        return value ? `- ${value}` : "";
      }
      const name = sanitizeText(phrase?.词组);
      if (!name) return "";
      const meaning = sanitizeText(phrase?.释义 ?? phrase?.解释);
      return meaning ? `- ${name} — ${meaning}` : `- ${name}`;
    })
    .filter(Boolean);

const buildLegacyPhoneticLines = (entry, labels) => {
  const phonetic = sanitizeText(entry?.phonetic);
  return phonetic ? [`- ${labels.phoneticEn}：${phonetic}`] : [];
};

const injectLegacyPhonetic = (state) =>
  appendSection(
    state,
    "phonetic",
    buildLegacyPhoneticLines(state.entry, state.labels),
  );

const buildLegacyDefinitionLines = (entry) =>
  (Array.isArray(entry?.definitions) ? entry.definitions : [])
    .map((definition, index) => {
      const content = sanitizeText(definition);
      return content ? `${index + 1}. ${content}` : "";
    })
    .filter(Boolean);

const injectLegacyDefinitions = (state) =>
  appendSection(state, "definitions", buildLegacyDefinitionLines(state.entry));

const buildLegacyExampleLine = (entry, labels) => {
  const example = sanitizeText(entry?.example);
  return example ? `- ${labels.example}：${example}` : "";
};

const appendLegacyExample = (state) => {
  const exampleLine = buildLegacyExampleLine(state.entry, state.labels);
  return exampleLine ? appendLines(state, [exampleLine, ""]) : state;
};

const legacyMarkdownPipeline = pipeline([
  ensureTermHeading,
  injectLegacyPhonetic,
  injectLegacyDefinitions,
  appendLegacyExample,
  finalizeMarkdown,
]);

class MarkdownStrategy {
  supports(entry) {
    return Boolean(
      entry && typeof entry.markdown === "string" && entry.markdown.trim(),
    );
  }

  build(entry) {
    return normalizeDictionaryMarkdown(entry.markdown);
  }
}

class LegacyEnglishStrategy {
  supports(entry) {
    if (!entry || typeof entry !== "object") return false;
    return (
      typeof entry.term === "string" ||
      isNonEmptyArray(entry.definitions) ||
      typeof entry.example === "string"
    );
  }

  build(entry) {
    return legacyMarkdownPipeline(createMarkdownState(entry));
  }
}

class StructuredChineseStrategy {
  supports(entry) {
    if (!entry || typeof entry !== "object") return false;
    return (
      Object.prototype.hasOwnProperty.call(entry, "发音解释") ||
      Object.prototype.hasOwnProperty.call(entry, "常见词组") ||
      Object.prototype.hasOwnProperty.call(entry, "发音")
    );
  }

  build(entry) {
    return structuredMarkdownPipeline(createMarkdownState(entry));
  }
}

const STRATEGIES = [
  new MarkdownStrategy(),
  new StructuredChineseStrategy(),
  new LegacyEnglishStrategy(),
];

export function buildDictionaryEntryMarkdown(entry) {
  for (const strategy of STRATEGIES) {
    if (strategy.supports(entry)) {
      return strategy.build(entry) ?? "";
    }
  }
  return "";
}

export const __INTERNAL__ = Object.freeze({
  STRATEGIES,
  MarkdownStrategy,
  StructuredChineseStrategy,
  LegacyEnglishStrategy,
});
