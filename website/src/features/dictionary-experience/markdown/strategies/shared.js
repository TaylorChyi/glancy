import { pipeline } from "../../../../shared/utils/pipeline.js";
import { normalizeDictionaryMarkdown } from "../dictionaryMarkdownNormalizer.js";

export const DEFAULT_HEADINGS = Object.freeze({
  term: "# %term%",
  phonetic: "## 发音",
  definitions: "## 释义",
  variants: "## 变形",
  phrases: "## 常见词组",
});

export const DEFAULT_LABELS = Object.freeze({
  phoneticEn: "英音",
  phoneticUs: "美音",
  synonyms: "同义词",
  antonyms: "反义词",
  related: "相关词",
  example: "例句",
  translation: "译文",
});

export const toTrimmedString = (value) => {
  if (value == null) return "";
  if (typeof value === "string") return value.trim();
  return String(value).trim();
};

export const isNonEmptyArray = (candidate) =>
  Array.isArray(candidate) && candidate.length > 0;

export const sanitizeText = (value) =>
  toTrimmedString(value).replace(/\s+/g, (segment, index) =>
    index === 0 ? "" : " ",
  );

export const createMarkdownState = (
  entry,
  headings = DEFAULT_HEADINGS,
  labels = DEFAULT_LABELS,
) => ({
  entry: entry ?? {},
  headings: headings ?? DEFAULT_HEADINGS,
  labels: labels ?? DEFAULT_LABELS,
  lines: [],
});

export const resolveHeading = (state, key) =>
  state.headings?.[key] ?? DEFAULT_HEADINGS[key];

export const appendLines = (state, additions) =>
  isNonEmptyArray(additions)
    ? { ...state, lines: [...state.lines, ...additions] }
    : state;

export const appendSection = (state, headingKey, content) => {
  if (!isNonEmptyArray(content)) {
    return state;
  }
  const heading = resolveHeading(state, headingKey);
  return heading ? appendLines(state, [heading, ...content, ""]) : state;
};

export const ensureTermHeading = (state) => {
  const template = resolveHeading(state, "term");
  const term = sanitizeText(state.entry["词条"] ?? state.entry.term);
  if (!template || !term) {
    return state;
  }
  return appendLines(state, [template.replace("%term%", term), ""]);
};

export const finalizeMarkdown = (state) => {
  const content = Array.isArray(state?.lines) ? state.lines.join("\n").trim() : "";
  return normalizeDictionaryMarkdown(content);
};

export { normalizeDictionaryMarkdown, pipeline };
