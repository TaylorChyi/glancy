/**
 * 背景：
 *  - 例句经常夹带 [[slot]]、{{tag}}、#marker# 等结构化标记，需要规范间距。
 * 目的：
 *  - 为示例正文补齐分词空格，并在后续行解析额外的分段标记。
 */
import {
  ASCII_PUNCTUATION,
  SEGMENTATION_MARKER_PATTERNS,
} from "../constants/index.js";
import { isCjkPunctuation } from "../characters.js";
import {
  collectExampleSegmentationAttachments,
  shouldNormalizeExampleLine,
} from "./attachments.js";

export function ensureSegmentationMarkerSpacing(value) {
  let result = value;
  for (const pattern of SEGMENTATION_MARKER_PATTERNS) {
    result = result.replace(pattern, (match, offset, source) => {
      let prefix = "";
      if (offset > 0 && !/\s/.test(source[offset - 1])) {
        prefix = " ";
      }
      const end = offset + match.length;
      let suffix = "";
      const nextChar = source[end];
      if (
        end < source.length &&
        !/\s/.test(nextChar) &&
        !isCjkPunctuation(nextChar) &&
        !ASCII_PUNCTUATION.has(nextChar)
      ) {
        suffix = " ";
      }
      return `${prefix}${match}${suffix}`;
    });
  }
  return result;
}

export function separateHanAndLatinTokens(value) {
  let result = value.replace(/(\p{Script=Han})([A-Za-z0-9])/gu, "$1 $2");
  result = result.replace(/([A-Za-z0-9])(\p{Script=Han})/gu, "$1 $2");
  return result;
}

export function normalizeExampleContent(value) {
  if (!value) {
    return value;
  }
  const withMarkerSpacing = ensureSegmentationMarkerSpacing(value);
  const separated = separateHanAndLatinTokens(withMarkerSpacing);
  return separated.replace(/\s{2,}/g, " ").trim();
}

export function applyExampleSegmentationSpacing(text) {
  if (!text) {
    return text;
  }
  const lines = text.split("\n");
  const normalized = [];
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    const match = line.match(
      /^(\s*(?:[-*+]|\d+[.)])?\s*\*\*([^*]+)\*\*:\s*)(.*)$/,
    );
    if (!match) {
      normalized.push(line);
      continue;
    }
    const [, prefix, label, rest] = match;
    if (!shouldNormalizeExampleLine(label)) {
      normalized.push(line);
      continue;
    }
    const { markerAttachments, preservedHeadings, consumed } =
      collectExampleSegmentationAttachments(lines, i + 1);
    const combined = markerAttachments.reduce((acc, attachment) => {
      return `${acc}${attachment.marker}${attachment.trailingText}`;
    }, rest);
    const normalizedContent = normalizeExampleContent(combined);
    if (!normalizedContent) {
      normalized.push(prefix.trimEnd());
    } else {
      normalized.push(`${prefix}${normalizedContent}`);
    }
    preservedHeadings.forEach((heading) => {
      normalized.push(heading);
    });
    i += consumed;
  }
  return normalized.join("\n").replace(/[ \t]+$/gm, "");
}
