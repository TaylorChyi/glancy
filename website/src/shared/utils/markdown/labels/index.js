/**
 * 背景：
 *  - 标签处理涉及候选词、换行、链式拆分与装饰多套策略。
 * 目的：
 *  - 聚合标签相关工具，便于 polishDictionaryMarkdown 统一引入。
 */
export * from "./candidates.js";
export { ensureInlineLabelLineBreak } from "./spacing.js";
export { normalizeLabelBreakArtifacts, enforceInlineLabelBoundary } from "./boundaries.js";
export {
  expandCollapsedLabelChains,
  separateAdjacentInlineLabels,
  resolveDanglingLabelSeparators,
  restoreMissingLabelDelimiters,
} from "./chains/index.js";
export {
  decorateBareInlineLabels,
  ensureColonSpacing,
  humanizeCompactMetadataValues,
} from "./decorators.js";
