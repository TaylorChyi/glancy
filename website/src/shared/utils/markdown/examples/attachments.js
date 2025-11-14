import { isExampleLabel } from "./labels.js";

const MARKER_WITH_TRAILING_HASH_PATTERN = /^#[^#\s]+#$/;
const MARKER_PATTERN = /^#[^#\s]+$/;
const ATTACHMENT_LINE_PATTERN = /^(#|\{\{|\[\[)/;

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

function createAttachmentState(startIndex) {
  return { markerAttachments: [], preservedHeadings: [], consumed: 0, cursor: startIndex };
}

function advanceAttachmentState(state, steps = 1) {
  state.consumed += steps;
  state.cursor += steps;
}

function recordPreservedHeading(state, heading) {
  state.preservedHeadings.push(heading);
  advanceAttachmentState(state);
}

function tryAttachSegmentationMarker(lines, state) {
  const parsed = parseSegmentationMarker(lines, state.cursor);
  if (!parsed) {
    recordPreservedHeading(state, lines[state.cursor]);
    return false;
  }
  state.markerAttachments.push(parsed);
  advanceAttachmentState(state, parsed.consumed);
  return true;
}

function attachInlineMarker(state, trimmed) {
  state.markerAttachments.push({ marker: trimmed, trailingText: "" });
  advanceAttachmentState(state);
}

export function collectExampleSegmentationAttachments(lines, startIndex) {
  const state = createAttachmentState(startIndex);
  while (state.cursor < lines.length) {
    const trimmed = lines[state.cursor].trimStart();
    if (trimmed === "") {
      advanceAttachmentState(state);
      continue;
    }
    if (!ATTACHMENT_LINE_PATTERN.test(trimmed)) {
      break;
    }
    if (trimmed.startsWith("#")) {
      if (!tryAttachSegmentationMarker(lines, state)) {
        break;
      }
      continue;
    }
    attachInlineMarker(state, trimmed);
  }
  const { markerAttachments, preservedHeadings, consumed } = state;
  return { markerAttachments, preservedHeadings, consumed };
}

export function shouldNormalizeExampleLine(label) {
  return isExampleLabel(label);
}
