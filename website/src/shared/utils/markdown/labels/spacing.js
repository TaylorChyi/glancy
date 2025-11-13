import {
  INLINE_LABEL_HYPHEN_GAP_PATTERN,
  INLINE_LABEL_PATTERN,
  INLINE_LABEL_SINGLE_SPACE_PATTERN,
} from "../constants/index.js";
import { computeListIndentation } from "../indentation.js";
import { shouldSplitInlineLabel } from "./candidates.js";

const rewriteHyphenGap = (...args) => {
  const [match, separator, label] = args;
  if (!shouldSplitInlineLabel(label)) {
    return match;
  }
  return " ".repeat(Math.max(2, separator.length));
};

const rewriteSingleSpaceGap = (...args) => {
  const [match, before, space, label, offset, source] = args;
  if (!shouldSplitInlineLabel(label)) {
    return match;
  }
  const lineStart = source.lastIndexOf("\n", offset) + 1;
  const prefix = source.slice(lineStart, offset + 1).trim();
  const isListMarker =
    prefix.length > 0 &&
    (/^[-*+]$/.test(prefix) || /^\d+[.)]$/.test(prefix));
  if (isListMarker) {
    return match;
  }
  return `${before}${space}${space}`;
};

function normalizeInlineLabelSpacing(text) {
  const hyphenNormalized = text.replace(
    INLINE_LABEL_HYPHEN_GAP_PATTERN,
    rewriteHyphenGap,
  );
  return hyphenNormalized.replace(
    INLINE_LABEL_SINGLE_SPACE_PATTERN,
    rewriteSingleSpaceGap,
  );
}

export function ensureInlineLabelLineBreak(text) {
  const normalizedSpacing = normalizeInlineLabelSpacing(text);
  return normalizedSpacing.replace(
    INLINE_LABEL_PATTERN,
    (...args) => {
      const [match, before, spaces, segment, label, offset, source] = args;
      if (!shouldSplitInlineLabel(label)) {
        return match;
      }
      if (spaces.length === 1) {
        const lineStart = source.lastIndexOf("\n", offset) + 1;
        const prefix = source.slice(lineStart, offset + 1).trim();
        const isListMarker =
          prefix.length > 0 &&
          (/^[-*+]$/.test(prefix) || /^\d+[.)]$/.test(prefix));
        if (isListMarker) {
          return match;
        }
      }
      const indent =
        computeListIndentation(source, offset) || spaces.replace(/\S/g, " ");
      return `${before}\n${indent}${segment}`;
    },
  );
}
