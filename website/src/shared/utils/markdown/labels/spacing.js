/**
 * 背景：
 *  - LLM 可能压缩标签间空格或使用连字符连接，影响后续换行判断。
 * 目的：
 *  - 先统一间距再执行换行策略，确保不同来源的标签格式一致。
 */
import {
  INLINE_LABEL_HYPHEN_GAP_PATTERN,
  INLINE_LABEL_PATTERN,
  INLINE_LABEL_SINGLE_SPACE_PATTERN,
} from "../constants/index.js";
import { computeListIndentation } from "../indentation.js";
import { shouldSplitInlineLabel } from "./candidates.js";

function normalizeInlineLabelSpacing(text) {
  const hyphenNormalized = text.replace(
    INLINE_LABEL_HYPHEN_GAP_PATTERN,
    (match, separator, label) => {
      if (!shouldSplitInlineLabel(label)) {
        return match;
      }
      return " ".repeat(Math.max(2, separator.length));
    },
  );
  return hyphenNormalized.replace(
    INLINE_LABEL_SINGLE_SPACE_PATTERN,
    (match, before, space, label, offset, source) => {
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
    },
  );
}

export function ensureInlineLabelLineBreak(text) {
  const normalizedSpacing = normalizeInlineLabelSpacing(text);
  return normalizedSpacing.replace(
    INLINE_LABEL_PATTERN,
    (match, before, spaces, segment, label, offset, source) => {
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
