import { LegacyEnglishStrategy } from "./strategies/legacyEnglishStrategy.js";
import { MarkdownStrategy } from "./strategies/markdownStrategy.js";
import { StructuredChineseStrategy } from "./strategies/structuredChineseStrategy.js";

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
