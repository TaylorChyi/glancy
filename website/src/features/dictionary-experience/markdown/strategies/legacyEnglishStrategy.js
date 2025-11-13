import {
  appendLines,
  appendSection,
  createMarkdownState,
  ensureTermHeading,
  finalizeMarkdown,
  isNonEmptyArray,
  pipeline,
  sanitizeText,
} from "./shared.js";

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

export class LegacyEnglishStrategy {
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
