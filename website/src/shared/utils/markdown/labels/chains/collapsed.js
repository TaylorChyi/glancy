import { COLLAPSED_LABEL_CHAIN_PATTERN } from "../../constants/index.js";
import { computeListIndentation } from "../../indentation.js";
import { shouldSplitInlineLabel } from "../candidates.js";

export function expandCollapsedLabelChains(text) {
  return text.replace(
    COLLAPSED_LABEL_CHAIN_PATTERN,
    (match, colon, label, offset, source) => {
      if (!shouldSplitInlineLabel(label)) {
        return match;
      }
      const nextChar = source[offset + colon.length];
      if (nextChar === "\n") {
        return match;
      }
      const indent = computeListIndentation(source, offset) || "";
      return `${colon}\n${indent}${label}`;
    },
  );
}
