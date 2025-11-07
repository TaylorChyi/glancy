import {
  INLINE_LABEL_BOUNDARY_PREFIX_RE,
  INLINE_LABEL_NO_BOUNDARY_PATTERN,
} from "../constants/index.js";
import { computeListIndentation } from "../indentation.js";
import { shouldSplitInlineLabel } from "./candidates.js";

export function normalizeLabelBreakArtifacts(text) {
  return text
    .replace(/: ([\p{Lu}])\n/gu, (_match, labelStart) => `:\n${labelStart}`)
    .replace(
      /([ \t]+)([\p{Lu}])\n([ \t]+)([\p{Ll}])/gu,
      (_match, _leading, upper, indent, lower) => `\n${indent}${upper}${lower}`,
    );
}

export function enforceInlineLabelBoundary(text) {
  return text.replace(
    INLINE_LABEL_NO_BOUNDARY_PATTERN,
    (match, before, segment, label, offset, source) => {
      if (!INLINE_LABEL_BOUNDARY_PREFIX_RE.test(before)) {
        return match;
      }
      if (!shouldSplitInlineLabel(label)) {
        return match;
      }
      const indent = computeListIndentation(source, offset) || "";
      return `${before}\n${indent}${segment}`;
    },
  );
}
