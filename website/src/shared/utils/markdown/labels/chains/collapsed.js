import { pipeline } from "../../../pipeline.js";
import { COLLAPSED_LABEL_CHAIN_PATTERN } from "../../constants/index.js";
import { computeListIndentation } from "../../indentation.js";
import { shouldSplitInlineLabel } from "../candidates.js";

const ensureTextInput = (text) => (typeof text === "string" ? text : "");

const expandCollapsedSegments = (text) =>
  text.replace(COLLAPSED_LABEL_CHAIN_PATTERN, rewriteCollapsedSegment);

const rewriteCollapsedSegment = (match, colon, label, offset, source) => {
  if (!shouldSplitInlineLabel(label)) {
    return match;
  }
  const nextChar = source[offset + colon.length];
  if (nextChar === "\n") {
    return match;
  }
  const indent = computeListIndentation(source, offset) || "";
  return `${colon}\n${indent}${label}`;
};

const expandCollapsedLabelChainsPipeline = pipeline([
  ensureTextInput,
  expandCollapsedSegments,
]);

export function expandCollapsedLabelChains(text) {
  return expandCollapsedLabelChainsPipeline(text);
}
