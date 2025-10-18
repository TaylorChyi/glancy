/**
 * 背景：
 *  - 单体函数版的 polishDictionaryMarkdown 难以维护，新增策略时需要在巨石文件中手动编排顺序。
 * 目的：
 *  - 引入策略链（Strategy + Pipeline）架构，将各类格式化能力拆分为可组合的纯函数，
 *    便于渐进演进与单元测试扩展。
 * 关键决策与取舍：
 *  - 通过 `createNormalizerPipeline` 以数组声明策略顺序，后续新增能力只需 append；
 *  - 每个策略模块保持独立输入输出，避免跨模块的隐式依赖。
 */
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
