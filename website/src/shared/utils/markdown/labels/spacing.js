import {
  INLINE_LABEL_HYPHEN_GAP_PATTERN,
  INLINE_LABEL_PATTERN,
  INLINE_LABEL_SINGLE_SPACE_PATTERN,
} from "../constants/index.js";
import { computeListIndentation } from "../indentation.js";
import { shouldSplitInlineLabel } from "./candidates.js";

const isListMarkerPrefix = (prefix) =>
  prefix.length > 0 &&
  (/^[-*+]$/.test(prefix) || /^\d+[.)]$/.test(prefix));

const getLinePrefix = (source, offset) => {
  const normalizedSource = typeof source === "string" ? source : "";
  const normalizedOffset = Number.isFinite(offset) ? offset : 0;
  const lineStart = normalizedSource.lastIndexOf("\n", normalizedOffset) + 1;
  return normalizedSource.slice(lineStart, normalizedOffset + 1).trim();
};

const toHyphenGapContext = (args) => {
  const [match = "", separator = "", label = ""] = args;
  return { match, separator, label };
};

const rewriteHyphenGap = (context) => {
  const { match, separator, label } = context;
  if (typeof label !== "string" || !shouldSplitInlineLabel(label)) {
    return match;
  }
  return " ".repeat(Math.max(2, separator.length));
};

const toSingleSpaceGapContext = (args) => {
  const [
    match = "",
    before = "",
    space = "",
    label = "",
    offset = 0,
    source = "",
  ] = args;
  return { match, before, space, label, offset, source };
};

const rewriteSingleSpaceGap = (context) => {
  const { match, before, space, label, offset, source } = context;
  if (typeof label !== "string" || !shouldSplitInlineLabel(label)) {
    return match;
  }
  const prefix = getLinePrefix(source, offset);
  if (isListMarkerPrefix(prefix)) {
    return match;
  }
  return `${before}${space}${space}`;
};

const toInlineLabelLineBreakContext = (args) => {
  const [
    match = "",
    before = "",
    spaces = "",
    segment = "",
    label = "",
    offset = 0,
    source = "",
  ] = args;
  return { match, before, spaces, segment, label, offset, source };
};

const rewriteInlineLabelLineBreak = (context) => {
  const { before, indent, segment } = context;
  return `${before}\n${indent}${segment}`;
};

function normalizeInlineLabelSpacing(text) {
  const hyphenNormalized = text.replace(
    INLINE_LABEL_HYPHEN_GAP_PATTERN,
    (...args) => rewriteHyphenGap(toHyphenGapContext(args)),
  );
  return hyphenNormalized.replace(
    INLINE_LABEL_SINGLE_SPACE_PATTERN,
    (...args) => rewriteSingleSpaceGap(toSingleSpaceGapContext(args)),
  );
}

export function ensureInlineLabelLineBreak(text) {
  const normalizedSpacing = normalizeInlineLabelSpacing(text);
  return normalizedSpacing.replace(
    INLINE_LABEL_PATTERN,
    (...args) => {
      const context = toInlineLabelLineBreakContext(args);
      const { match, spaces, label, offset, source } = context;
      if (typeof label !== "string" || !shouldSplitInlineLabel(label)) {
        return match;
      }
      if (spaces.length === 1) {
        const prefix = getLinePrefix(source, offset);
        if (isListMarkerPrefix(prefix)) {
          return match;
        }
      }
      const indent =
        computeListIndentation(source, offset) || spaces.replace(/\S/g, " ");
      return rewriteInlineLabelLineBreak({
        ...context,
        indent,
      });
    },
  );
}
