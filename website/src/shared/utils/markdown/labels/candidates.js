/**
 * 背景：
 *  - 标签换行、译文分段等能力需要准确识别标签候选词，兼容驼峰、数字、双语等多种形态。
 * 目的：
 *  - 集中处理标签候选词的归一化、动态匹配与展示格式，供其它策略复用。
 */
import {
  INLINE_LABEL_CAMEL_CASE,
  INLINE_LABEL_DELIMITER,
  INLINE_LABEL_DYNAMIC_PATTERNS,
  INLINE_LABEL_TERMINATORS,
  INLINE_LABEL_TOKENS,
} from "../constants/index.js";

export function normalizeInlineLabelCandidate(raw) {
  if (!raw) {
    return "";
  }
  return raw
    .toString()
    .replace(/：/g, ":")
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fff]+/g, "");
}

function matchesDynamicInlineLabel(candidate) {
  if (!candidate) {
    return false;
  }
  return INLINE_LABEL_DYNAMIC_PATTERNS.some((pattern) =>
    pattern.test(candidate),
  );
}

export function isInlineLabelTerminator(char) {
  if (!char) {
    return false;
  }
  return INLINE_LABEL_TERMINATORS.has(char);
}

function collectInlineLabelKeywords(raw) {
  if (!raw) {
    return [];
  }
  const camelSeparated = raw
    .replace(/：/g, ":")
    .replace(INLINE_LABEL_CAMEL_CASE, "$1 $2")
    .toLowerCase();
  return camelSeparated
    .split(INLINE_LABEL_DELIMITER)
    .map((token) => token.trim())
    .filter(Boolean);
}

export function collectInlineLabelCandidates(label) {
  const keywords = collectInlineLabelKeywords(label);
  const candidates = new Set();
  candidates.add(normalizeInlineLabelCandidate(label));
  if (keywords.length > 0) {
    candidates.add(normalizeInlineLabelCandidate(keywords.join("")));
  }
  keywords.forEach((token) => {
    candidates.add(normalizeInlineLabelCandidate(token));
  });
  candidates.delete("");
  return candidates;
}

export function shouldSplitInlineLabel(label) {
  const candidates = collectInlineLabelCandidates(label);
  if (candidates.size === 0) {
    return false;
  }
  for (const candidate of candidates) {
    if (INLINE_LABEL_TOKENS.has(candidate)) {
      return true;
    }
  }
  for (const candidate of candidates) {
    if (matchesDynamicInlineLabel(candidate)) {
      return true;
    }
  }
  return false;
}

function humanizeLabelFragment(label) {
  return label
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/([A-Za-z])(\d)/g, "$1 $2")
    .replace(/(\d)([A-Za-z])/g, "$1 $2")
    .replace(/[.]/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

export function formatSenseLabel(label) {
  const normalized = normalizeInlineLabelCandidate(label);
  const match = normalized.match(/^(?:s|sense)(\d+)([a-z]*)$/);
  if (!match) {
    return null;
  }
  const [, index] = match;
  const categorySource = label.replace(/^[sS](?:ense)?\d+/, "");
  const spacedCategory = humanizeLabelFragment(categorySource);
  if (!spacedCategory) {
    return `Sense ${index}`;
  }
  const normalizedCategory = spacedCategory
    .split(/\s+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
  return `Sense ${index} · ${normalizedCategory}`;
}

export function deriveInlineLabelDisplay(label) {
  const senseLabel = formatSenseLabel(label);
  if (senseLabel) {
    return senseLabel;
  }
  const normalized = normalizeInlineLabelCandidate(label);
  if (/^example\d+$/.test(normalized)) {
    const [, index = ""] = normalized.match(/^example(\d+)$/) || [];
    return index ? `Example ${index}` : humanizeLabelFragment(label);
  }
  return humanizeLabelFragment(label);
}
