/**
 * 背景：
 *  - 标签链的拆分、补写与缩进逻辑分散在多个子策略中，提供统一出口便于组合。
 */
export { expandCollapsedLabelChains } from "./collapsed.js";
export { separateAdjacentInlineLabels } from "./adjacent.js";
export { resolveDanglingLabelSeparators } from "./dangling.js";
export { restoreMissingLabelDelimiters } from "./delimiters.js";
