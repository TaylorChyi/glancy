import { isExampleLabel } from "./labels.js";

function isSegmentationHeading(trimmed) {
  return trimmed.startsWith("#") && !/^##/.test(trimmed);
}

function normalizeSegmentationMarker(trimmed) {
  return trimmed.replace(/\s+/g, "");
}

function parseTrailingSegmentationMarker(lines, startIndex, normalized, consumed) {
  let gapConsumed = 0;
  for (let idx = startIndex + 1; idx < lines.length; idx += 1) {
    const { trimmed } = readTrimmedLine(lines, idx);
    if (trimmed === "") {
      gapConsumed += 1;
      continue;
    }
    if (!isSegmentationHeading(trimmed)) {
      return null;
    }
    const trailingText = trimmed.replace(/^#\s*/, "");
    return {
      marker: `${normalized}#`,
      trailingText,
      consumed: consumed + gapConsumed + 1,
    };
  }
  return null;
}

export function parseSegmentationMarker(lines, startIndex) {
  if (startIndex >= lines.length) {
    return null;
  }
  const { trimmed } = readTrimmedLine(lines, startIndex);
  if (!isSegmentationHeading(trimmed)) {
    return null;
  }
  const normalized = normalizeSegmentationMarker(trimmed);
  const closedMatch = /^#[^#\s]+#$/.test(normalized);
  if (closedMatch) {
    return { marker: normalized, trailingText: "", consumed: 1 };
  }
  if (!/^#[^#\s]+$/.test(normalized)) {
    return null;
  }
  return parseTrailingSegmentationMarker(lines, startIndex, normalized, 1);
}

function skipWhitespace(lines, cursor) {
  let consumed = 0;
  let nextCursor = cursor;
  while (nextCursor < lines.length && lines[nextCursor].trim() === "") {
    consumed += 1;
    nextCursor += 1;
  }
  return { consumed, cursor: nextCursor };
}

function readTrimmedLine(lines, index) {
  const original = lines[index];
  return { original, trimmed: original.trimStart() };
}

function isAttachmentCandidate(trimmed) {
  return /^(#|\{\{|\[\[)/.test(trimmed);
}

function pushAttachment(list, attachment, consumedAmount) {
  list.push(attachment);
  return consumedAmount;
}

function createInlineAttachment(trimmed) {
  return { marker: trimmed, trailingText: "" };
}

function applyWhitespace(lines, state) {
  const whitespace = skipWhitespace(lines, state.cursor);
  state.consumed += whitespace.consumed;
  state.cursor = whitespace.cursor;
  return state.cursor < lines.length;
}

function handleMarkerAttachment(lines, state, original, markerAttachments, preservedHeadings) {
  const parsed = parseSegmentationMarker(lines, state.cursor);
  if (!parsed) {
    preservedHeadings.push(original);
    state.consumed += 1;
    return false;
  }
  state.consumed += pushAttachment(markerAttachments, parsed, parsed.consumed);
  state.cursor += parsed.consumed;
  return true;
}

export function collectExampleSegmentationAttachments(lines, startIndex) {
  const markerAttachments = [];
  const preservedHeadings = [];
  const state = { cursor: startIndex, consumed: 0 };
  while (state.cursor < lines.length) {
    if (!applyWhitespace(lines, state)) {
      break;
    }
    const { original, trimmed } = readTrimmedLine(lines, state.cursor);
    if (!isAttachmentCandidate(trimmed)) {
      break;
    }
    if (trimmed.startsWith("#")) {
      if (!handleMarkerAttachment(lines, state, original, markerAttachments, preservedHeadings)) {
        break;
      }
      continue;
    }
    state.consumed += pushAttachment(
      markerAttachments,
      createInlineAttachment(trimmed),
      1,
    );
    state.cursor += 1;
  }
  return {
    markerAttachments,
    preservedHeadings,
    consumed: state.consumed,
  };
}

export function shouldNormalizeExampleLine(label) {
  return isExampleLabel(label);
}
