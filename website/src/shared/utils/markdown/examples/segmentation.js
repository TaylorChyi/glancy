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

function matchSegmentationLabel(line) {
  const match = line.match(
    /^(\s*(?:[-*+]|\d+[.)])?\s*\*\*([^*]+)\*\*:\s*)(.*)$/,
  );
  if (!match) {
    return null;
  }
  const [, prefix, label, rest] = match;
  return { prefix, label, rest };
}

function combineMarkerAttachments(rest, markerAttachments) {
  return markerAttachments.reduce((acc, attachment) => {
    return `${acc}${attachment.marker}${attachment.trailingText}`;
  }, rest);
}

function normalizeSegmentationLine(lines, index, parsed) {
  if (!shouldNormalizeExampleLine(parsed.label)) {
    return null;
  }
  const { markerAttachments, preservedHeadings, consumed } =
    collectExampleSegmentationAttachments(lines, index + 1);
  const combined = combineMarkerAttachments(parsed.rest, markerAttachments);
  const normalizedContent = normalizeExampleContent(combined);
  const normalizedLines = [];
  if (!normalizedContent) {
    normalizedLines.push(parsed.prefix.trimEnd());
  } else {
    normalizedLines.push(`${parsed.prefix}${normalizedContent}`);
  }
  normalizedLines.push(...preservedHeadings);
  return { normalizedLines, consumed };
}

export function applyExampleSegmentationSpacing(text) {
  if (!text) {
    return text;
  }
  const lines = text.split("\n");
  const normalized = [];
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    const parsed = matchSegmentationLabel(line);
    if (!parsed) {
      normalized.push(line);
      continue;
    }
    const result = normalizeSegmentationLine(lines, i, parsed);
    if (!result) {
      normalized.push(line);
      continue;
    }
    normalized.push(...result.normalizedLines);
    i += result.consumed;
  }
  return normalized.join("\n").replace(/[ \t]+$/gm, "");
}
