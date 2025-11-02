/**
 * 背景：
 *  - 提供标题归一化策略的聚合出口，供 polishDictionaryMarkdown 顺序执行。
 * 目的：
 *  - 统一导出基础间距、章节拆分、列表拆分与标签拆分能力。
 */
export {
  ensureHeadingSpacing,
  ensureHeadingPadding,
  ensureHeadingLineBreak,
  mergeBrokenHeadingLines,
} from "./base.js";
export { isolateSectionHeadingContent } from "./sections.js";
export { separateHeadingListMarkers, ensureListSpacing } from "./lists.js";
export { createSeparateHeadingInlineLabels } from "./inlineLabels.js";
