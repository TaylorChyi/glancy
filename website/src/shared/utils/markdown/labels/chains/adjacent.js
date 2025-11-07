import {
  ADJACENT_LABEL_PATTERN,
  INLINE_LABEL_TOKENS,
} from "../../constants/index.js";
import {
  computeListIndentation,
  deriveLineIndentation,
} from "../../indentation.js";
import {
  formatSenseLabel,
  normalizeInlineLabelCandidate,
  shouldSplitInlineLabel,
} from "../candidates.js";

const STRONG_LABEL_BOUNDARY_PATTERN = /^[A-Z\u4e00-\u9fff]/u;

function resolveAdjacentLabelSplit(segment) {
  const token = segment.slice(0, -1);
  if (formatSenseLabel(token)) {
    return null;
  }
  let best = null;
  for (let index = 1; index < token.length; index += 1) {
    const suffix = token.slice(index);
    if (!shouldSplitInlineLabel(suffix)) {
      continue;
    }
    const prefix = token.slice(0, index);
    if (!prefix.trim()) {
      continue;
    }
    const normalized = normalizeInlineLabelCandidate(suffix);
    const candidate = {
      prefix,
      label: suffix,
      exact: INLINE_LABEL_TOKENS.has(normalized),
      strong: STRONG_LABEL_BOUNDARY_PATTERN.test(suffix),
      length: suffix.length,
      index,
    };
    if (!best) {
      best = candidate;
      continue;
    }
    if (candidate.exact !== best.exact) {
      best = candidate.exact ? candidate : best;
      continue;
    }
    if (candidate.strong !== best.strong) {
      best = candidate.strong ? candidate : best;
      continue;
    }
    if (candidate.length !== best.length) {
      best = candidate.length > best.length ? candidate : best;
      continue;
    }
    if (candidate.index < best.index) {
      best = candidate;
    }
  }
  if (!best) {
    return null;
  }
  return { prefix: best.prefix, label: best.label };
}

export function separateAdjacentInlineLabels(text) {
  return text.replace(ADJACENT_LABEL_PATTERN, (segment, offset, source) => {
    const lineStart = source.lastIndexOf("\n", offset - 1) + 1;
    const precedingSlice = source.slice(lineStart, offset);
    if (!precedingSlice.includes(":") && !precedingSlice.includes("：")) {
      return segment;
    }
    const boundaryChar = source[offset - 1];
    const resolved =
      boundaryChar === ":" || boundaryChar === "："
        ? resolveAdjacentLabelSplit(segment)
        : null;
    const indent =
      computeListIndentation(source, offset - 1) ||
      deriveLineIndentation(source, offset);
    if (!resolved) {
      return `\n${indent}${segment}`;
    }
    const { prefix, label } = resolved;
    return `${prefix}\n${indent}${label}:`;
  });
}
