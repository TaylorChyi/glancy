/**
 * 背景：
 *  - 例句排版涉及标签判断、分词空格与译文拆分等多个维度。
 * 目的：
 *  - 聚合示例相关策略，供 polishDictionaryMarkdown 统一调度。
 */
export * from "./labels.js";
export {
  ensureSegmentationMarkerSpacing,
  separateHanAndLatinTokens,
  normalizeExampleContent,
  applyExampleSegmentationSpacing,
} from "./segmentation.js";
export {
  parseSegmentationMarker,
  collectExampleSegmentationAttachments,
  shouldNormalizeExampleLine,
} from "./attachments.js";
export { deriveExampleTranslationIndent } from "./translation/indent.js";
export {
  stripTranslationWrappers,
  extractParentheticalTranslation,
} from "./translation/wrappers.js";
export { ensureExampleTranslationLayout } from "./translation/layout.js";
