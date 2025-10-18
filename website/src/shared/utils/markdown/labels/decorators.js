/**
 * 背景：
 *  - 裸标签、紧凑值与缺失空格的冒号会降低 Markdown 可读性。
 * 目的：
 *  - 提供标签装饰与元数据值人性化展示能力。
 */
import {
  BARE_INLINE_LABEL_PATTERN,
  COLON_WITHOUT_SPACE_PATTERN,
  DECORATED_LABEL_VALUE_PATTERN,
} from "../constants/index.js";
import { deriveInlineLabelDisplay, shouldSplitInlineLabel } from "./candidates.js";

export function decorateBareInlineLabels(text) {
  return text.replace(
    BARE_INLINE_LABEL_PATTERN,
    (match, leading, label, offset, source) => {
      const labelStart = offset + leading.length;
      const precedingChar = source[labelStart - 1];
      if (precedingChar === "*" || !shouldSplitInlineLabel(label)) {
        return match;
      }
      const display = deriveInlineLabelDisplay(label);
      return `${leading}**${display}**`;
    },
  );
}

export function ensureColonSpacing(text) {
  return text.replace(
    COLON_WITHOUT_SPACE_PATTERN,
    (match, next, offset, source) => {
      const previous = offset > 0 ? source[offset - 1] : "";
      if (next === "/" && source[offset + 2] === "/") {
        return match;
      }
      if (/\d/.test(previous) && /\d/.test(next)) {
        return match;
      }
      return `: ${next}`;
    },
  );
}

export function humanizeCompactMetadataValues(text) {
  return text.replace(
    DECORATED_LABEL_VALUE_PATTERN,
    (match, labelToken, rawLabel, rawValue) => {
      if (!rawValue || /\s/.test(rawValue)) {
        return match;
      }
      if (!shouldSplitInlineLabel(rawLabel)) {
        return match;
      }
      const humanizedValue = rawValue
        .replace(/([a-z])([A-Z])/g, "$1 $2")
        .replace(/([A-Za-z])(\d)/g, "$1 $2")
        .replace(/(\d)([A-Za-z])/g, "$1 $2")
        .trim();
      if (humanizedValue === rawValue) {
        return match;
      }
      return `**${rawLabel}**: ${humanizedValue}`;
    },
  );
}
