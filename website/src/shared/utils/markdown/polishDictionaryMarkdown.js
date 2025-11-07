import { normalizeNewlines } from "./jsonPreview.js";
import {
  ensureHeadingSpacing,
  ensureHeadingPadding,
  ensureHeadingLineBreak,
  mergeBrokenHeadingLines,
  isolateSectionHeadingContent,
  separateHeadingListMarkers,
  ensureListSpacing,
  createSeparateHeadingInlineLabels,
} from "./headings/index.js";
import {
  ensureInlineLabelLineBreak,
  normalizeLabelBreakArtifacts,
  enforceInlineLabelBoundary,
  expandCollapsedLabelChains,
  separateAdjacentInlineLabels,
  resolveDanglingLabelSeparators,
  restoreMissingLabelDelimiters,
  decorateBareInlineLabels,
  ensureColonSpacing,
  humanizeCompactMetadataValues,
  shouldSplitInlineLabel,
} from "./labels/index.js";
import { ensureEnglishPunctuationSpacing } from "./punctuation.js";
import {
  applyExampleSegmentationSpacing,
  ensureExampleTranslationLayout,
} from "./examples/index.js";

function createNormalizerPipeline(strategies) {
  return function runPipeline(input) {
    return strategies.reduce((current, normalize) => normalize(current), input);
  };
}

const separateHeadingInlineLabels = createSeparateHeadingInlineLabels(
  shouldSplitInlineLabel,
);

const DICTIONARY_NORMALIZERS = [
  normalizeNewlines,
  mergeBrokenHeadingLines,
  restoreMissingLabelDelimiters,
  separateAdjacentInlineLabels,
  normalizeLabelBreakArtifacts,
  expandCollapsedLabelChains,
  decorateBareInlineLabels,
  enforceInlineLabelBoundary,
  ensureColonSpacing,
  humanizeCompactMetadataValues,
  ensureHeadingLineBreak,
  ensureHeadingSpacing,
  separateHeadingListMarkers,
  separateHeadingInlineLabels,
  isolateSectionHeadingContent,
  ensureHeadingPadding,
  ensureListSpacing,
  ensureInlineLabelLineBreak,
  resolveDanglingLabelSeparators,
  ensureEnglishPunctuationSpacing,
  applyExampleSegmentationSpacing,
  ensureExampleTranslationLayout,
  (text) => text.replace(/[ \t]+$/gm, ""),
];

const runDictionaryPipeline = createNormalizerPipeline(DICTIONARY_NORMALIZERS);

export function polishDictionaryMarkdown(source) {
  if (!source) {
    return "";
  }
  return runDictionaryPipeline(source);
}
