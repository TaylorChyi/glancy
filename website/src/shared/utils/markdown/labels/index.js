export * from "./candidates.js";
export { ensureInlineLabelLineBreak } from "./spacing.js";
export {
  normalizeLabelBreakArtifacts,
  enforceInlineLabelBoundary,
} from "./boundaries.js";
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
