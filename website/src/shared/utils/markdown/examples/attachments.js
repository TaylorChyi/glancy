import { isExampleLabel } from "./labels.js";

const MARKER_WITH_TRAILING_HASH_PATTERN = /^#[^#\s]+#$/;
const MARKER_PATTERN = /^#[^#\s]+$/;

function isSegmentationHeading(trimmed) {
  return trimmed.startsWith("#") && !/^##/.test(trimmed);
}

function normalizeMarker(trimmed) {
  return trimmed.replace(/\s+/g, "");
}

function parseTrailingHeading(lines, startIndex) {
  let gapConsumed = 0;
  for (let idx = startIndex + 1; idx < lines.length; idx += 1) {
    const candidateTrimmed = lines[idx].trimStart();
    if (candidateTrimmed === "") {
      gapConsumed += 1;
      continue;
    }
    if (!isSegmentationHeading(candidateTrimmed)) {
      return null;
    }
    return {
      trailingText: candidateTrimmed.replace(/^#\s*/, ""),
      consumed: gapConsumed + 1,
    };
  }
  return null;
}

export function parseSegmentationMarker(lines, startIndex) {
  if (startIndex >= lines.length) {
    return null;
  }
  const trimmed = lines[startIndex].trimStart();
  if (!isSegmentationHeading(trimmed)) {
    return null;
  }
  const normalized = normalizeMarker(trimmed);
  if (MARKER_WITH_TRAILING_HASH_PATTERN.test(normalized)) {
    return { marker: normalized, trailingText: "", consumed: 1 };
  }
  if (!MARKER_PATTERN.test(normalized)) {
    return null;
  }
  const trailingHeading = parseTrailingHeading(lines, startIndex);
  if (!trailingHeading) {
    return null;
  }
  return {
    marker: `${normalized}#`,
    trailingText: trailingHeading.trailingText,
    consumed: 1 + trailingHeading.consumed,
  };
}

export function collectExampleSegmentationAttachments(lines, startIndex) {
  const markerAttachments = [];
  const preservedHeadings = [];
  let consumed = 0;
  let cursor = startIndex;
  while (cursor < lines.length) {
    const current = lines[cursor];
    const trimmed = current.trimStart();
    if (trimmed === "") {
      consumed += 1;
      cursor += 1;
      continue;
    }
    if (!/^(#|\{\{|\[\[)/.test(trimmed)) {
      break;
    }
    if (trimmed.startsWith("#")) {
      const parsed = parseSegmentationMarker(lines, cursor);
      if (!parsed) {
        preservedHeadings.push(current);
        consumed += 1;
        break;
      }
      markerAttachments.push(parsed);
      consumed += parsed.consumed;
      cursor += parsed.consumed;
      continue;
    }
    markerAttachments.push({ marker: trimmed, trailingText: "" });
    consumed += 1;
    cursor += 1;
  }
  return { markerAttachments, preservedHeadings, consumed };
}

export function shouldNormalizeExampleLine(label) {
  return isExampleLabel(label);
}
