import {
  INLINE_LABEL_BOUNDARY_PREFIX_RE,
  INLINE_LABEL_NO_BOUNDARY_PATTERN,
} from "../constants/index.js";
import { computeListIndentation } from "../indentation.js";
import { shouldSplitInlineLabel } from "./candidates.js";

const toInlineLabelBoundaryContext = (args) => {
  const [
    match = "",
    before = "",
    segment = "",
    label = "",
    offset = 0,
    source = "",
  ] = args;
  return { match, before, segment, label, offset, source };
};

const rewriteInlineLabelBoundary = (context) => {
  const { match, before, segment, label, offset, source } = context;
  if (!INLINE_LABEL_BOUNDARY_PREFIX_RE.test(before)) {
    return match;
  }
  if (typeof label !== "string" || !shouldSplitInlineLabel(label)) {
    return match;
  }
  const indent = computeListIndentation(source, offset) || "";
  return `${before}\n${indent}${segment}`;
};

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
    (...args) => rewriteInlineLabelBoundary(toInlineLabelBoundaryContext(args)),
  );
}
