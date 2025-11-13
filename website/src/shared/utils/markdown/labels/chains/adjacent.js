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

const buildSplitCandidate = (token, index) => {
  const suffix = token.slice(index);
  if (!shouldSplitInlineLabel(suffix)) {
    return null;
  }
  const prefix = token.slice(0, index);
  if (!prefix.trim()) {
    return null;
  }
  const normalized = normalizeInlineLabelCandidate(suffix);
  return {
    prefix,
    label: suffix,
    exact: INLINE_LABEL_TOKENS.has(normalized),
    strong: STRONG_LABEL_BOUNDARY_PATTERN.test(suffix),
    length: suffix.length,
    index,
  };
};

const pickBetterCandidate = (current, candidate) => {
  if (!current) {
    return candidate;
  }
  if (candidate.exact !== current.exact) {
    return candidate.exact ? candidate : current;
  }
  if (candidate.strong !== current.strong) {
    return candidate.strong ? candidate : current;
  }
  if (candidate.length !== current.length) {
    return candidate.length > current.length ? candidate : current;
  }
  return candidate.index < current.index ? candidate : current;
};

function resolveAdjacentLabelSplit(segment) {
  const token = segment.slice(0, -1);
  if (formatSenseLabel(token)) {
    return null;
  }
  let best = null;
  for (let index = 1; index < token.length; index += 1) {
    const candidate = buildSplitCandidate(token, index);
    if (candidate) {
      best = pickBetterCandidate(best, candidate);
    }
  }
  return best ? { prefix: best.prefix, label: best.label } : null;
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
